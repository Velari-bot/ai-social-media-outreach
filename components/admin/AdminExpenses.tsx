"use client";

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, DollarSign, TrendingDown, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

interface Expense {
    id: string;
    name: string;
    description?: string;
    amount: number;
    frequency: 'one-time' | 'monthly' | 'yearly';
    category: string;
    date_added: string;
}

export default function AdminExpenses() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [monthlyTotal, setMonthlyTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        amount: '',
        frequency: 'monthly' as 'one-time' | 'monthly' | 'yearly',
        category: '',
    });

    // Mock MRR for profit calculation (you can replace this with real data from your stats API)
    const [mrr, setMrr] = useState(0);

    useEffect(() => {
        fetchExpenses();
        fetchMRR();
    }, []);

    const fetchExpenses = async () => {
        try {
            const res = await fetch('/api/admin/expenses');
            const data = await res.json();
            if (data.success) {
                setExpenses(data.expenses);
                setMonthlyTotal(data.monthlyTotal);
            }
        } catch (error) {
            console.error('Error fetching expenses:', error);
            toast.error('Failed to load expenses');
        } finally {
            setLoading(false);
        }
    };

    const fetchMRR = async () => {
        try {
            const res = await fetch('/api/admin/stats');
            const data = await res.json();
            if (data.success && data.stats) {
                setMrr(data.stats.mrr || 0);
            }
        } catch (error) {
            console.error('Error fetching MRR:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.amount || !formData.category) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            if (editingExpense) {
                // Update existing
                const res = await fetch('/api/admin/expenses', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: editingExpense.id, ...formData }),
                });

                if (res.ok) {
                    toast.success('Expense updated');
                    setEditingExpense(null);
                } else {
                    toast.error('Failed to update expense');
                }
            } else {
                // Create new
                const res = await fetch('/api/admin/expenses', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });

                if (res.ok) {
                    toast.success('Expense added');
                } else {
                    toast.error('Failed to add expense');
                }
            }

            setFormData({ name: '', description: '', amount: '', frequency: 'monthly', category: '' });
            setShowAddModal(false);
            fetchExpenses();
        } catch (error) {
            toast.error('An error occurred');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this expense?')) return;

        try {
            const res = await fetch(`/api/admin/expenses?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Expense deleted');
                fetchExpenses();
            } else {
                toast.error('Failed to delete expense');
            }
        } catch (error) {
            toast.error('An error occurred');
        }
    };

    const handleEdit = (expense: Expense) => {
        setEditingExpense(expense);
        setFormData({
            name: expense.name,
            description: expense.description || '',
            amount: expense.amount.toString(),
            frequency: expense.frequency,
            category: expense.category,
        });
        setShowAddModal(true);
    };

    const profit = mrr - monthlyTotal;

    return (
        <div className="space-y-6">
            {/* Header with Profit Overview */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-black">Expenses & Profit</h1>
                    <p className="text-gray-500 text-sm mt-1">Track monthly costs and calculate profit</p>
                </div>
                <button
                    onClick={() => {
                        setEditingExpense(null);
                        setFormData({ name: '', description: '', amount: '', frequency: 'monthly', category: '' });
                        setShowAddModal(true);
                    }}
                    className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 flex items-center gap-2"
                >
                    <Plus size={18} />
                    Add Expense
                </button>
            </div>

            {/* Profit Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <TrendingUp className="text-green-600" size={20} />
                        </div>
                        <span className="text-sm font-medium text-gray-500">MRR</span>
                    </div>
                    <p className="text-2xl font-bold text-black">${mrr.toLocaleString()}</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-50 rounded-lg">
                            <TrendingDown className="text-red-600" size={20} />
                        </div>
                        <span className="text-sm font-medium text-gray-500">Monthly Costs</span>
                    </div>
                    <p className="text-2xl font-bold text-black">${monthlyTotal.toLocaleString()}</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <DollarSign className="text-blue-600" size={20} />
                        </div>
                        <span className="text-sm font-medium text-gray-500">Monthly Profit</span>
                    </div>
                    <p className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${profit.toLocaleString()}
                    </p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-50 rounded-lg">
                            <DollarSign className="text-purple-600" size={20} />
                        </div>
                        <span className="text-sm font-medium text-gray-500">Profit Margin</span>
                    </div>
                    <p className="text-2xl font-bold text-black">
                        {mrr > 0 ? ((profit / mrr) * 100).toFixed(1) : 0}%
                    </p>
                </div>
            </div>

            {/* Expenses Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-black">All Expenses</h2>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-gray-500">Loading...</div>
                ) : expenses.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        No expenses yet. Click "Add Expense" to get started.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Frequency</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Monthly Impact</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {expenses.map((expense) => {
                                    const monthlyImpact = expense.frequency === 'monthly'
                                        ? expense.amount
                                        : expense.frequency === 'yearly'
                                            ? expense.amount / 12
                                            : 0;

                                    return (
                                        <tr key={expense.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="font-medium text-black">{expense.name}</div>
                                                    {expense.description && (
                                                        <div className="text-sm text-gray-500">{expense.description}</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                                    {expense.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-black">${expense.amount.toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${expense.frequency === 'monthly' ? 'bg-blue-100 text-blue-700' :
                                                        expense.frequency === 'yearly' ? 'bg-purple-100 text-purple-700' :
                                                            'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {expense.frequency}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-black">
                                                {monthlyImpact > 0 ? `$${monthlyImpact.toLocaleString()}` : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(expense)}
                                                        className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(expense.id)}
                                                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <h2 className="text-xl font-bold text-black mb-4">
                            {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-black/5"
                                    placeholder="e.g. Stripe Fees"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-black/5"
                                    placeholder="e.g. Payment Processing, Software, API"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-black/5"
                                    placeholder="0.00"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency *</label>
                                <select
                                    value={formData.frequency}
                                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-black/5"
                                    required
                                >
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                    <option value="one-time">One-time</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-black/5"
                                    rows={3}
                                    placeholder="Optional notes..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setEditingExpense(null);
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800"
                                >
                                    {editingExpense ? 'Update' : 'Add'} Expense
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
