import React from "react"
import { cn } from "../../utils"

const Input = React.forwardRef(({ className, type, error, ...props }, ref) => {
  return (
    <div className="w-full relative">
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-red-500 focus-visible:ring-red-500",
          className
        )}
        ref={ref}
        {...props}
      />
      {error && <span className="text-xs text-red-500 mt-1 block">{error}</span>}
    </div>
  )
})
Input.displayName = "Input"

export { Input }
