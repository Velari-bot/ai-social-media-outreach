import { NextRequest, NextResponse } from 'next/server';
import { getAllExpenses, createExpense, updateExpense, deleteExpense, calculateMonthlyExpenses } from '@/lib/expenses';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/expenses
 * Get all expenses and monthly total
 */
export async function GET(request: NextRequest) {
    try {
        const expenses = await getAllExpenses();
        const monthlyTotal = await calculateMonthlyExpenses();

        return NextResponse.json({
            success: true,
            expenses,
            monthlyTotal,
        });
    } catch (error: any) {
        console.error('Error fetching expenses:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/admin/expenses
 * Create a new expense
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, description, amount, frequency, category } = body;

        if (!name || !amount || !frequency || !category) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const expense = await createExpense({
            name,
            description,
            amount: parseFloat(amount),
            frequency,
            category,
        });

        if (!expense) {
            return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
        }

        return NextResponse.json({ success: true, expense });
    } catch (error: any) {
        console.error('Error creating expense:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * PUT /api/admin/expenses
 * Update an expense
 */
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'Expense ID required' }, { status: 400 });
        }

        const success = await updateExpense(id, updates);

        if (!success) {
            return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating expense:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/expenses?id=xxx
 * Delete an expense
 */
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Expense ID required' }, { status: 400 });
        }

        const success = await deleteExpense(id);

        if (!success) {
            return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting expense:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
