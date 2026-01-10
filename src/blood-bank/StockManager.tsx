import React from "react";
import { BloodGroup } from "./bloodBankService";

type Props = {
  bloodGroup: BloodGroup;
  units: number;
  onUpdate: (delta: number) => void;
};

const StockManager: React.FC<Props> = ({ onUpdate }) => {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onUpdate(1)}
        className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        +1
      </button>
      <button
        onClick={() => onUpdate(-1)}
        className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700"
      >
        -1
      </button>
    </div>
  );
};

export default StockManager;
