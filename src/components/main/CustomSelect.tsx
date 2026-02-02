import * as React from "react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export interface SelectOption {
    value: string
    label: string
    icon?: React.ReactNode
}

interface CustomSelectProps {
    value?: string
    onValueChange: (value: string) => void
    options: (SelectOption | string)[]
    placeholder?: string
    disabled?: boolean
    className?: string
    side?: "top" | "bottom" | "left" | "right"
    align?: "start" | "center" | "end"
}

export function CustomSelect({
    value,
    onValueChange,
    options,
    placeholder = "Select an option",
    disabled = false,
    className,
    side = "top",
    align = "start",
}: CustomSelectProps) {
    return (
        <Select value={value} onValueChange={onValueChange} disabled={disabled}>
            <SelectTrigger className={cn("w-full", className)}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent side={side} align={align}>
                {options.map((option) => {
                    const isString = typeof option === "string"
                    const value = isString ? option : option.value
                    const label = isString ? option : option.label
                    const icon = !isString ? option.icon : null

                    return (
                        <SelectItem key={value} value={value}>
                            <div className="flex items-center gap-2">
                                {icon && <span className="flex-shrink-0">{icon}</span>}
                                <span className="truncate">{label}</span>
                            </div>
                        </SelectItem>
                    )
                })}
            </SelectContent>
        </Select>
    )
}
