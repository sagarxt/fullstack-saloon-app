import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import UserNavbar from "../../components/user/UserNavbar";
import { getMyBooking } from "../../api/customer";
import { cancelBooking } from "../../api/customer";

export default function BookingDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);

    useEffect(() => {
        load();
    }, [id]);

    const load = async () => {
        try {
            const res = await getMyBooking(id);
            setBooking(res.data);
        } catch {
            alert("Failed to load booking details");
        }
    };

    if (!booking) {
        return <div className="p-6">Loading...</div>;
    }

    const handleCancel = async () => {
        if (!window.confirm("Are you sure you want to cancel this booking?")) return;

        try {
            await cancelBooking(booking.id);
            alert("Booking cancelled");
            navigate("/customer/bookings");
        } catch {
            alert("Failed to cancel booking");
        }
    };

    const canReschedule =
        booking.status !== "CANCELLED" &&
        booking.status !== "COMPLETED";

    return (
        <div className="min-h-screen bg-gray-50">
            <UserNavbar />

            <main className="max-w-3xl mx-auto p-6 space-y-6">
                <button
                    onClick={() => navigate(-1)}
                    className="text-sm text-gray-600 hover:text-black"
                >
                    ← Back
                </button>

                <div className="bg-white rounded-xl shadow p-6 space-y-4">
                    <h2 className="text-xl font-semibold">
                        Booking Details
                    </h2>

                    {/* Summary */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-500">Booking ID</span>
                            <div className="font-mono">{booking.id}</div>
                        </div>

                        <div>
                            <span className="text-gray-500">Status</span>
                            <div className="font-semibold">{booking.status}</div>
                        </div>

                        <div>
                            <span className="text-gray-500">Scheduled At</span>
                            <div>
                                {new Date(booking.scheduledAt).toLocaleString()}
                            </div>
                        </div>

                        <div>
                            <span className="text-gray-500">Booked By</span>
                            <div>{booking.bookedBy}</div>
                        </div>
                    </div>

                    {/* Services */}
                    <div className="border-t pt-4">
                        <h3 className="font-medium mb-2">Services</h3>

                        <div className="space-y-2 text-sm">
                            {booking.items.map((i, index) => (
                                <div
                                    key={i.id ?? index}
                                    className="flex justify-between"
                                >
                                    <span>
                                        {i.serviceName} ({i.duration} min)
                                    </span>
                                    <span>₹{i.price}</span>
                                </div>
                            ))}
                        </div>
                    </div>


                    {/* Pricing */}
                    <div className="border-t pt-4 text-sm space-y-1">
                        <div className="flex justify-between">
                            <span>MRP</span>
                            <span>₹{booking.totalAmount}</span>
                        </div>

                        {booking.couponId && (
                            <div className="flex justify-between text-green-600">
                                <span>Discount</span>
                                <span>
                                    -₹{booking.totalAmount - booking.pricePaid}
                                </span>
                            </div>
                        )}

                        <div className="flex justify-between font-semibold">
                            <span>Paid</span>
                            <span>₹{booking.pricePaid}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    {/* Actions */}
                    {canReschedule && (
                        <div className="pt-4 flex justify-between items-center">
                            {/* Cancel */}
                            <button
                                onClick={handleCancel}
                                className="border border-red-300 text-red-600 px-4 py-2 rounded-md hover:bg-red-50"
                            >
                                Cancel Booking
                            </button>

                            {/* Reschedule */}
                            <button
                                onClick={() =>
                                    navigate(`/customer/book/${booking.id}`, {
                                        state: { reschedule: true },
                                    })
                                }
                                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                            >
                                Reschedule Booking
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
