import React from "react";
import { useChatContext } from "@/contexts/ChatContext";
import { Button } from "@/components/ui/button";
import { ActionType } from "@/lib/types";

export function ActionButtons() {
  const { setSelectedAction, state } = useChatContext();
  const { selectedAction } = state;

  // Define the available actions
  const actions: { value: ActionType; label: string }[] = [
    { value: "complete", label: "Giải đầy đủ" },
    { value: "concise", label: "Giải rút gọn" },
    { value: "hint", label: "Gợi ý" },
  ];

  return (
    <div className="bg-gray-50 dark:bg-gray-800 p-2 flex flex-wrap justify-center gap-2 border-t border-gray-200 dark:border-gray-700">
      {actions.map((action) => (
        <Button
          key={action.value}
          variant={selectedAction === action.value ? "default" : "outline"}
          className={`rounded-full px-3 py-1.5 h-auto ${
            selectedAction === action.value
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:hover:bg-blue-800"
          }`}
          onClick={() => setSelectedAction(action.value)}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}
