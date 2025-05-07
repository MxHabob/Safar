import Image from "next/image"

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 md:p-8">
      <div className="container max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="w-full md:w-1/2 space-y-8">
          {/* Circle placeholder */}
          <div className="w-24 h-24 rounded-full bg-gray-200 border border-indigo-700"></div>

          {/* Text placeholders */}
          <div className="space-y-6">
            <div className="h-6 bg-gray-200 rounded-full w-3/4"></div>
            <div className="h-10 bg-gray-200 rounded-full w-full"></div>

            {/* Button placeholder */}
            <div className="h-10 bg-gray-200 rounded-full w-1/3 mt-8"></div>
          </div>
        </div>

        {/* Island illustration */}
        <div className="w-full md:w-1/2 flex justify-center md:justify-end">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-M117rtpC92JLIJc3pzHW2svg1pbB2h.png"
            width={300}
            height={300}
            alt="Tropical island with palm tree"
            priority
          />
        </div>
      </div>
    </main>
  )
}
