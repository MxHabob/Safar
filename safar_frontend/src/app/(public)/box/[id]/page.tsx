import BoxPageContant from "@/components/section/box";

type Props = {
	params: Promise<{ id: string}>
	
  }
  export default async function BoxPage({  params  }: Props) {
    const id = (await params).id
    return (
      <div >
      <BoxPageContant id={id} />
       </div>
  );
}
 
