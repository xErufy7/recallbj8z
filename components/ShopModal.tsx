
import React from 'react';
import { GameState, Item } from '../types';
import { SHOP_ITEMS } from '../data/mechanics';
import { getShopPriceMultiplier } from '../data/utils';

interface ShopModalProps {
    state: GameState;
    /** 键盘按压标记（App 的 keyFlash），命中时按钮呈按下状态 */
    flashTag?: string | null;
    onClose: () => void;
    onPurchase: (item: Item, actualPrice: number) => void;
}

const ShopModal: React.FC<ShopModalProps> = ({ state, flashTag, onClose, onPurchase }) => {
    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-fadeIn" onClick={onClose}>
            <div className="bg-white rounded-3xl w-full max-w-2xl h-[90vh] md:h-auto md:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
                <div className="flex-none p-6 md:p-8 border-b border-slate-100 bg-white z-10 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800">小卖部</h2>
                        <p className="text-sm text-slate-500">持有金钱: <span className="text-yellow-600 font-bold">{state.general.money}</span></p>
                    </div>
                    <button onClick={onClose} className={`w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors ${flashTag === 'shop-close' ? 'key-pressed' : ''}`}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scroll p-6 md:p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-safe">
                        {SHOP_ITEMS.map(item => {
                            const multiplier = getShopPriceMultiplier(state);
                            const actualPrice = Math.floor(item.price * multiplier);
                            return (
                            <button key={item.id} onClick={() => onPurchase(item, actualPrice)} disabled={state.general.money < actualPrice} className="p-4 rounded-xl border border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left flex items-center gap-4 group disabled:opacity-50 active:scale-95">
                                <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:text-indigo-600"><i className={`fas ${item.icon} text-xl`}></i></div>
                                <div className="flex-1"><div className="flex justify-between items-center"><span className="font-bold text-slate-800">{item.name}</span><span className="text-sm font-bold text-yellow-600">{actualPrice} G</span></div><p className="text-xs text-slate-400 mt-1">{item.description}</p></div>
                            </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShopModal;
