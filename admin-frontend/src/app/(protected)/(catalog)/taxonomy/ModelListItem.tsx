import React from "react";
import { getModelStatusClassName } from "./modelStatusClassName";

export const ModelListItem = ({ model }: { model: any }) => (
    <li className="flex items-center gap-3 pl-28 pr-4 py-2 border-b border-slate-50 last:border-none hover:bg-slate-50 transition-colors">
        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
        <span className="text-xs text-slate-700 flex-1">{model.name}</span>
        <span
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${getModelStatusClassName(model.status || (model.isActive ? "live" : "inactive"))}`}
        >
            {model.status || (model.isActive ? "live" : "inactive")}
        </span>
    </li>
);
