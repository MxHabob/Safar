import { PlacePageContant } from "@/components/section/place";

type Props = {
	params: Promise<{ id: string}>
	
  }
  export default async function PlacePage({  params  }: Props) {
    const id = (await params).id
    return (
      <div className="">
        <PlacePageContant id={id} />
      </div>
        );
}
 
