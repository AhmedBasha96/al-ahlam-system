'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive' | 'warning';
}

export function ConfirmDialog({
    open,
    onOpenChange,
    onConfirm,
    title = "هل أنت متأكد؟",
    description = "هذه العملية قد تؤثر على الحسابات أو المخزون. يرجى التأكد من البيانات قبل التأكيد.",
    confirmText = "تأكيد واستمرار",
    cancelText = "تراجع",
    variant = 'default'
}: ConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]" dir="rtl">
                <DialogHeader className="text-right">
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <AlertTriangle className={`w-6 h-6 ${variant === 'destructive' ? 'text-red-500' : 'text-amber-500'}`} />
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-slate-600 font-medium pt-2">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex flex-col sm:flex-row-reverse gap-2 pt-4">
                    <Button
                        variant={variant === 'destructive' ? 'destructive' : 'default'}
                        onClick={() => {
                            onConfirm();
                            onOpenChange(false);
                        }}
                        className={`font-bold px-8 ${variant === 'default' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                    >
                        {confirmText}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="font-bold border-slate-200"
                    >
                        {cancelText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
