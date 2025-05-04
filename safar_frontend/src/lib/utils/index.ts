import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import ContinueWithSocialAuth from './continue-with-social-auth';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const continueWithGoogle = () =>
	ContinueWithSocialAuth('google-oauth2', 'google');
export const continueWithFacebook = () =>
	ContinueWithSocialAuth('facebook', 'facebook');

export const getInitials = (firstName?: string, lastName?: string): string => {
  const firstInitial = firstName?.charAt(0).toUpperCase() || "";
  const lastInitial = lastName?.charAt(0).toUpperCase() || "";
  return `${firstInitial}${lastInitial}`;
};

export function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount)
}