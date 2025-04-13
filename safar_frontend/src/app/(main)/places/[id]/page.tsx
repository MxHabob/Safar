import { PlacePageContant } from "@/components/main/place";

type Props = {
	params: Promise<{ id: string}>
	
  }
  export default async function PlaceDetailsPage({  params  }: Props) {
    const id = (await params).id
    return (
      <div className="">
        <PlacePageContant id={id} />
      </div>
        );
}
 
