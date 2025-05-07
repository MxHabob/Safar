import { IntroductionProfile } from "@/components/main/profile/introduction-profile";
type Props = {
	params: Promise<{ id: string}>
}

export default async function ProfileIntroduction({  params  }: Props) {
  const id = (await params).id
  return (
    <main className="min-h-full flex items-center justify-center p-4 md:p-8 mt-24">
      <IntroductionProfile userId={id}/>
    </main>
  )
}
