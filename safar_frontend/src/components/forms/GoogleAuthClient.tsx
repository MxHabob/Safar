'use client';

import { useSocialAuthMutation } from "@/core/services/api";
import { Spinner } from "../ui/spinner";
import useSocialAuth from "@/core/hooks/use-social-auth";

export default function GoogleAuthClient() {
  const [googleAuthenticate] = useSocialAuthMutation();
  useSocialAuth(googleAuthenticate, 'google-oauth2');

  return (
    <div className='flex justify-center items-center'>
      <Spinner />
    </div>
  );
}