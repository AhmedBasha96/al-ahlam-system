"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function OverviewChart({ data }: { data: any[] }) {
    // data format: [{ name: 'Jan', sales: 4000, expenses: 2400, profit: 1600 }, ...]

    return (
        <Card className="col-span-4 border-0 shadow-lg">
            <CardHeader>
                <CardTitle className="text-lg font-medium text-slate-700">تحليل الأداء المالي (آخر 6 أشهر)</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <div className="h-[350px] w-full dir-ltr">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis
                                dataKey="name"
                                stroke="#64748B"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#64748B"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                            />
                            <Tooltip
                                cursor={{ fill: '#F1F5F9' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend iconType="circle" />
                            <Bar dataKey="sales" name="المبيعات" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={20} />
                            <Bar dataKey="expenses" name="المصروفات" fill="#F97316" radius={[4, 4, 0, 0]} barSize={20} />
                            <Bar dataKey="profit" name="الربح" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
