import { db } from './firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export interface Expense {
    id: string;
    name: string;
    description?: string;
    amount: number;
    frequency: 'one-time' | 'monthly' | 'yearly';
    category: string;
    date_added: Timestamp | string;
    created_at: Timestamp | string;
    updated_at: Timestamp | string;
}

/**
 * Get all expenses
 */
export async function getAllExpenses(): Promise<Expense[]> {
    try {
        const snapshot = await db.collection('expenses').orderBy('created_at', 'desc').get();
        return snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data(),
            created_at: doc.data().created_at?.toDate?.()?.toISOString() || doc.data().created_at,
            updated_at: doc.data().updated_at?.toDate?.()?.toISOString() || doc.data().updated_at,
            date_added: doc.data().date_added?.toDate?.()?.toISOString() || doc.data().date_added,
        })) as Expense[];
    } catch (error) {
        console.error('Error fetching expenses:', error);
        return [];
    }
}

/**
 * Create a new expense
 */
export async function createExpense(data: {
    name: string;
    description?: string;
    amount: number;
    frequency: 'one-time' | 'monthly' | 'yearly';
    category: string;
}): Promise<Expense | null> {
    try {
        const now = Timestamp.now();
        const docRef = await db.collection('expenses').add({
            ...data,
            date_added: now,
            created_at: now,
            updated_at: now,
        });

        const doc = await docRef.get();
        return {
            id: doc.id,
            ...doc.data(),
            created_at: doc.data()?.created_at?.toDate?.()?.toISOString(),
            updated_at: doc.data()?.updated_at?.toDate?.()?.toISOString(),
            date_added: doc.data()?.date_added?.toDate?.()?.toISOString(),
        } as Expense;
    } catch (error) {
        console.error('Error creating expense:', error);
        return null;
    }
}

/**
 * Update an expense
 */
export async function updateExpense(id: string, data: Partial<Expense>): Promise<boolean> {
    try {
        await db.collection('expenses').doc(id).update({
            ...data,
            updated_at: Timestamp.now(),
        });
        return true;
    } catch (error) {
        console.error('Error updating expense:', error);
        return false;
    }
}

/**
 * Delete an expense
 */
export async function deleteExpense(id: string): Promise<boolean> {
    try {
        await db.collection('expenses').doc(id).delete();
        return true;
    } catch (error) {
        console.error('Error deleting expense:', error);
        return false;
    }
}

/**
 * Calculate total monthly cost from all expenses
 */
export async function calculateMonthlyExpenses(): Promise<number> {
    try {
        const expenses = await getAllExpenses();
        let totalMonthly = 0;

        expenses.forEach(expense => {
            if (expense.frequency === 'monthly') {
                totalMonthly += expense.amount;
            } else if (expense.frequency === 'yearly') {
                totalMonthly += expense.amount / 12;
            }
            // one-time expenses don't count toward monthly recurring
        });

        return totalMonthly;
    } catch (error) {
        console.error('Error calculating monthly expenses:', error);
        return 0;
    }
}
