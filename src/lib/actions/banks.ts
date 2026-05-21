'use server';

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { BankTransactionType, LoanStatus, InstallmentStatus } from "@prisma/client";

// --- Bank Actions ---

export async function getBanks(agencyIdFilter?: string) {
    const user = await (await import("@/lib/actions")).getCurrentUser();
    const isRestricted = user.role !== 'ADMIN' && user.role !== 'MANAGER';

    const where: any = {};
    if (agencyIdFilter) {
        where.agencyId = agencyIdFilter;
    } else if (isRestricted) {
        where.agencyId = user.agencyId;
    }

    const banks = await prisma.bank.findMany({
        where,
        include: {
            _count: {
                select: { loans: { where: { status: 'ACTIVE' } } }
            }
        }
    });

    return banks.map(bank => ({
        ...bank,
        balance: Number(bank.balance)
    }));
}

export async function createBank(data: FormData) {
    const name = data.get('name') as string;
    const accountNumber = data.get('accountNumber') as string;
    const initialBalance = Number(data.get('initialBalance'));
    const agencyId = data.get('agencyId') as string || null;

    await prisma.bank.create({
        data: {
            name,
            accountNumber,
            balance: initialBalance,
            agencyId: agencyId === 'GENERAL' ? null : agencyId
        }
    });
    revalidatePath('/dashboard/accounts/banks');
}

export async function getBankDetails(id: string) {
    const bank = await prisma.bank.findUnique({
        where: { id },
        include: {
            transactions: {
                orderBy: { date: 'desc' },
                take: 20
            },
            loans: {
                include: {
                    installments: {
                        orderBy: { dueDate: 'asc' }
                    }
                }
            }
        }
    });

    if (!bank) return null;

    return {
        ...bank,
        balance: Number(bank.balance),
        transactions: bank.transactions.map(tx => ({
            ...tx,
            amount: Number(tx.amount)
        })),
        loans: bank.loans.map(loan => ({
            ...loan,
            principal: Number(loan.principal),
            interest: Number(loan.interest),
            totalAmount: Number(loan.totalAmount),
            installments: loan.installments.map(inst => ({
                ...inst,
                amount: Number(inst.amount)
            }))
        }))
    };
}

// --- Bank Transaction Actions ---

export async function createBankTransaction(data: FormData) {
    const bankId = data.get('bankId') as string;
    const type = data.get('type') as BankTransactionType;
    const amount = Number(data.get('amount'));
    const description = data.get('description') as string;
    const imageFile = data.get('image') as File | null;

    // Convert image to Base64 if provided
    let imageUrl: string | null = null;
    if (imageFile && imageFile.size > 0) {
        const arrayBuffer = await imageFile.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        imageUrl = `data:${imageFile.type};base64,${base64}`;
    }

    await prisma.$transaction(async (tx) => {
        // Create Transaction Record
        await tx.bankTransaction.create({
            data: {
                bankId,
                amount,
                type,
                description,
                imageUrl: imageUrl,
            }
        });

        // Update Balance
        if (type === 'DEPOSIT') {
            await tx.bank.update({
                where: { id: bankId },
                data: { balance: { increment: amount } }
            });
        } else {
            await tx.bank.update({
                where: { id: bankId },
                data: { balance: { decrement: amount } }
            });
        }
    }, { timeout: 20000 });

    revalidatePath(`/dashboard/accounts/banks/${bankId}`);
    revalidatePath('/dashboard/accounts/banks');
}

export async function depositFromSafeToBank(data: FormData) {
    const bankId = data.get('bankId') as string;
    const amount = Number(data.get('amount'));
    const description = data.get('description') as string;
    const agencyIdRaw = data.get('agencyId') as string;
    const imageFile = data.get('image') as File | null;

    // Determine source safe (General or Agency-specific)
    const agencyId = (agencyIdRaw && agencyIdRaw !== 'GENERAL') ? agencyIdRaw : null;

    const user = await prisma.user.findFirst(); // Replace with getCurrentUser() in production
    if (!user) throw new Error('User not found');

    const sourceLabel = agencyIdRaw === 'GENERAL' ? 'الخزنة العامة'
        : await prisma.agency.findUnique({ where: { id: agencyIdRaw } }).then(a => a?.name || 'Unknown');

    // Convert image to Base64 if provided
    let imageUrl: string | null = null;
    if (imageFile && imageFile.size > 0) {
        const arrayBuffer = await imageFile.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        imageUrl = `data:${imageFile.type};base64,${base64}`;
    }

    await prisma.$transaction(async (tx) => {
        // 1. Deduct from Safe -> Create EXPENSE in AccountRecord
        await tx.accountRecord.create({
            data: {
                type: 'EXPENSE',
                amount,
                description: `تحويل إلى البنك: ${description} (من ${sourceLabel})`,
                agencyId: agencyId,  // null for General Safe
                userId: user.id,
                imageUrl: imageUrl,
            }
        });

        // 2. Deposit to Bank -> Create DEPOSIT in BankTransaction
        await tx.bankTransaction.create({
            data: {
                bankId,
                amount,
                type: 'DEPOSIT',
                description: `إيداع من ${sourceLabel}: ${description}`,
                imageUrl: imageUrl,
            }
        });

        // 3. Update Bank Balance
        await tx.bank.update({
            where: { id: bankId },
            data: { balance: { increment: amount } }
        });
    }, { timeout: 20000 });

    revalidatePath(`/dashboard/accounts/banks/${bankId}`);
    revalidatePath('/dashboard/accounts/banks');
    revalidatePath('/dashboard/accounts', 'layout'); // Update safe balance
}

// --- Loan Actions ---

export async function createLoan(data: FormData) {
    const bankId = data.get('bankId') as string;
    const principal = Number(data.get('principal'));
    const interestRate = Number(data.get('interestRate')) || 0; // Percentage, e.g., 10 for 10%
    const months = Number(data.get('months'));
    const startDate = new Date(data.get('startDate') as string);
    const notes = data.get('notes') as string;

    const interestAmount = principal * (interestRate / 100);
    const totalAmount = principal + interestAmount;
    const monthlyInstallment = totalAmount / months;

    await prisma.$transaction(async (tx) => {
        // 1. Create Loan
        const loan = await tx.loan.create({
            data: {
                bankId,
                principal,
                interest: interestAmount,
                totalAmount,
                startDate,
                notes,
                status: 'ACTIVE'
            }
        });

        // 2. Generate Installments
        const installmentsData = [];
        for (let i = 0; i < months; i++) {
            const dueDate = new Date(startDate);
            dueDate.setMonth(dueDate.getMonth() + (i + 1)); // First installment next month

            installmentsData.push({
                loanId: loan.id,
                amount: monthlyInstallment,
                dueDate: dueDate,
                status: InstallmentStatus.PENDING
            });
        }
        await tx.installment.createMany({ data: installmentsData });

        // 3. Deposit money into Bank (Loan proceeds)
        // Usually taking a loan means money enters the account.
        await tx.bankTransaction.create({
            data: {
                bankId,
                amount: principal, // We deposit the principal received
                type: 'DEPOSIT',
                description: `قرض جديد: ${notes || ''}`
            }
        });
        await tx.bank.update({
            where: { id: bankId },
            data: { balance: { increment: principal } }
        });
    }, { timeout: 20000 });

    revalidatePath(`/dashboard/accounts/banks/${bankId}`);
}

export async function payInstallment(installmentId: string, bankId: string) {
    await prisma.$transaction(async (tx) => {
        const installment = await tx.installment.findUnique({ where: { id: installmentId }, include: { loan: true } });
        if (!installment || installment.status === 'PAID') throw new Error("Installment invalid or paid");

        // 1. Mark as Paid
        await tx.installment.update({
            where: { id: installmentId },
            data: { status: 'PAID', paidDate: new Date() }
        });

        // 2. Deduct from Bank
        await tx.bankTransaction.create({
            data: {
                bankId,
                amount: installment.amount,
                type: 'WITHDRAWAL',
                description: `سداد قسط قرض: ${installment.loan.notes || 'بدون وصف'}`
            }
        });

        await tx.bank.update({
            where: { id: bankId },
            data: { balance: { decrement: installment.amount } }
        });

        // 3. Check if Loan is fully paid
        const pendingInstallments = await tx.installment.count({
            where: { loanId: installment.loanId, status: 'PENDING' }
        });

        if (pendingInstallments === 0) {
            await tx.loan.update({
                where: { id: installment.loanId },
                data: { status: 'PAID', endDate: new Date() }
            });
        }
    }, { timeout: 20000 });

    revalidatePath(`/dashboard/accounts/banks/${bankId}`);
}

// --- Alerts ---

export async function getUpcomingInstallments() {
    // Get installments due in the next 7 days
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const installments = await prisma.installment.findMany({
        where: {
            status: { in: ['PENDING', 'OVERDUE'] },
            dueDate: { lte: nextWeek }
        },
        include: {
            loan: {
                include: { bank: true }
            }
        },
        orderBy: { dueDate: 'asc' }
    });

    // Serialization for client
    return installments.map(inst => ({
        ...inst,
        amount: Number(inst.amount),
        loan: {
            ...inst.loan,
            principal: Number(inst.loan.principal),
            interest: Number(inst.loan.interest),
            totalAmount: Number(inst.loan.totalAmount),
            bank: {
                ...inst.loan.bank,
                balance: Number(inst.loan.bank.balance)
            }
        }
    }));
}
