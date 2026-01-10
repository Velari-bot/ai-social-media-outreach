
"use client";

import { Save, Shield, Bell, Globe, Key, Database } from "lucide-react";

export default function AdminSettings() {
    return (
        <div className="space-y-8 max-w-4xl">
            <div>
                <h1 className="text-3xl font-black text-black">Admin Settings</h1>
                <p className="text-gray-500 mt-1">Configure global application parameters and security.</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* Platform Config */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
                                <Globe className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-black">Platform Configuration</h3>
                                <p className="text-xs text-gray-400 font-medium">Global app-wide settings.</p>
                            </div>
                        </div>
                        <button className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-800 transition-all flex items-center gap-2">
                            <Save className="w-3.5 h-3.5" />
                            Save Changes
                        </button>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">APP NAME</label>
                                <input type="text" defaultValue="Verality AI" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-black font-medium focus:ring-2 focus:ring-black/5 outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">SUPPORT EMAIL</label>
                                <input type="email" defaultValue="support@verality.io" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-black font-medium focus:ring-2 focus:ring-black/5 outline-none" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <div className="flex items-center gap-3">
                                <Shield className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-sm font-bold text-black">Maintenance Mode</p>
                                    <p className="text-xs text-gray-500">Toggle site visibility for maintenance.</p>
                                </div>
                            </div>
                            <div className="w-12 h-6 bg-gray-200 rounded-full relative cursor-pointer">
                                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* API & Keys */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                        <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
                            <Key className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-black">API Connections</h3>
                            <p className="text-xs text-gray-400 font-medium">Manage external service integrations.</p>
                        </div>
                    </div>
                    <div className="p-8 space-y-4 text-sm">
                        <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-[10px] text-gray-400 group-hover:bg-white transition-colors">STR</div>
                                <div>
                                    <p className="font-bold text-black">Stripe Integration</p>
                                    <p className="text-xs text-green-600 font-medium">Connected & Active</p>
                                </div>
                            </div>
                            <button className="text-xs font-bold text-gray-400 hover:text-black">Configure</button>
                        </div>
                        <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-[10px] text-gray-400 group-hover:bg-white transition-colors">OAI</div>
                                <div>
                                    <p className="font-bold text-black">OpenAI GPT-4</p>
                                    <p className="text-xs text-green-600 font-medium">Quota: 85% Remaining</p>
                                </div>
                            </div>
                            <button className="text-xs font-bold text-gray-400 hover:text-black">Configure</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
