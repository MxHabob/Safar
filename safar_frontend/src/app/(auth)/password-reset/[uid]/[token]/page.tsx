

type Props = {
	params: Promise<{ uid: string ,token:string}>
	
  }

export default async function ResetPasswordPage({  params  }: Props) {
	const uid = (await params).uid
	const token = (await params).token

	return (
		<>
		<h5 className="font-bold text-base text-themeTextWhite">Login</h5>
		<p className="text-themeTextGray leading-tight">
		Protect yourself from misinformation with advanced video verification.
		</p>
		<p>{uid}{token}</p>
		</>
	);
}
