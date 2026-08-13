
import React, { useEffect, useRef } from 'react';
import { drawReportCard, ReportCardData } from '../lib/reportCard';

interface ReportCardModalProps {
    data: ReportCardData;
    onClose: () => void;
}

/** 结局页毕业成绩单预览 + 下载 */
const ReportCardModal: React.FC<ReportCardModalProps> = ({ data, onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current) drawReportCard(canvasRef.current, data);
    }, [data]);

    const download = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.toBlob(blob => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `八中成绩单-${data.rank}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 'image/png');
    };

    return (
        <div className="fixed inset-0 z-[130] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-white rounded-3xl p-4 md:p-6 max-w-md w-full shadow-2xl flex flex-col max-h-[92vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-3 flex-shrink-0">
                    <h3 className="text-lg font-black text-slate-800">毕业成绩单</h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"><i className="fas fa-times"></i></button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scroll rounded-xl border border-slate-200">
                    <canvas ref={canvasRef} width={750} height={1000} className="w-full h-auto block" />
                </div>
                <div className="flex gap-3 mt-4 flex-shrink-0">
                    <button onClick={download} className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-700 shadow-lg transition-all"><i className="fas fa-download mr-1.5"></i>保存图片</button>
                </div>
            </div>
        </div>
    );
};

export default ReportCardModal;
