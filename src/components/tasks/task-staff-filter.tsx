"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStaff } from "@/hooks/use-staff";
import { ChevronDown } from "lucide-react";

interface TaskStaffFilterProps {
  value: string | "all";
  onValueChange: (value: string | "all") => void;
  label?: string;
}

export function TaskStaffFilter({ 
  value, 
  onValueChange, 
  label = "Staff" 
}: TaskStaffFilterProps) {
  const { staff } = useStaff();

  const getDisplayLabel = () => {
    if (value === "all") {
      return "All Staffs";
    }
    const selectedStaff = staff.find(s => s.id === value);
    return selectedStaff ? selectedStaff.name : "All Staffs";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className=" w-[140px] justify-between"
        >
          <span>{getDisplayLabel()}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[180px]">
        <DropdownMenuItem
          onClick={() => onValueChange("all")}
          className={value === "all" ? "bg-accent" : ""}
        >
          All Staffs
        </DropdownMenuItem>
        {staff.map((staffMember) => (
          <DropdownMenuItem
            key={staffMember.id}
            onClick={() => onValueChange(staffMember.id)}
            className={value === staffMember.id ? "bg-accent" : ""}
          >
            {staffMember.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

