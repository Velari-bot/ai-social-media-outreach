
import BookingWizard from "@/components/booking/BookingWizard";
import Navbar from "@/components/Navbar";

export default function BookCallPage() {
    return (
        <main className="min-h-screen bg-white">
            <Navbar />
            <div className="pt-28 pb-20 px-4 md:px-8">
                <BookingWizard />
            </div>
        </main>
    );
}
