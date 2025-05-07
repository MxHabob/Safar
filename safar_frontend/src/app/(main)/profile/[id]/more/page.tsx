import { MoreProfile } from "@/components/main/profile/more-profile";

type Props = {
	params: Promise<{ id: string}>
}

export default async  function ProfileMore({  params  }: Props) {
  const id = (await params).id

  return (
    <main className="min-h-full flex items-center justify-center p-4 md:p-8">
      <MoreProfile userId={id} />
    </main>
  )
}
