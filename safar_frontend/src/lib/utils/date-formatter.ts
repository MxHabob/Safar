export function formatDate(dateString?: string, options?: Intl.DateTimeFormatOptions) {
    if (!dateString) return ''
    
    const date = new Date(dateString)
    const defaultOptions: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }
    
    return date.toLocaleDateString('en-US', options || defaultOptions)
  }
  
  export function formatRelativeTime(dateString: string) {
    const date = new Date(dateString)
    const now = new Date()
    
    const diffInMs = now.getTime() - date.getTime()
    const diffInSecs = Math.floor(diffInMs / 1000)
    const diffInMins = Math.floor(diffInSecs / 60)
    const diffInHours = Math.floor(diffInMins / 60)
    const diffInDays = Math.floor(diffInHours / 24)
    
    if (diffInSecs < 60) return `${diffInSecs} seconds ago`
    if (diffInMins < 60) return `${diffInMins} minutes ago`
    if (diffInHours < 24) return `${diffInHours} hours ago`
    if (diffInDays < 7) return `${diffInDays} days ago`
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    })
  }
  
export const formattedPrice = (currency: string = "USD", price: number = 0) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}
