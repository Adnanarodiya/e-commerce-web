"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ArrowLeft, CheckCircle, CreditCard, Shield, Truck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Checkout() {
  const { cart, clearCart } = useCart();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
  });

  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank">("cash");
  const [confirmPaid, setConfirmPaid] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [amountPaid, setAmountPaid] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"cash" | "bank">("cash");

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discount = subtotal >= 5000 ? subtotal * 0.10 : 0;
  const discountedSubtotal = subtotal - discount;
  const shipping = subtotal > 50 ? 0 : 9.99;
  const total = discountedSubtotal + shipping;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "address",
      "city",
      "state",
      "zipCode",
    ];

    requiredFields.forEach((field) => {
      if (!formData[field as keyof typeof formData].trim()) {
        newErrors[field] = "This field is required";
      }
    });

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (paymentMethod === "bank" && !confirmPaid) {
      newErrors.confirmPaid = "Please confirm that you have scanned the QR code and completed the payment";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    // Simulate API request delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generate random Order ID
    const randomOrderId = "NM-" + Math.floor(100000 + Math.random() * 900000);
    setOrderId(randomOrderId);
    setAmountPaid(total);
    setSelectedPaymentMethod(paymentMethod);
    setIsSubmitting(false);
    setIsSuccess(true);
    clearCart();
  };

  if (isSuccess) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-lg">
        <div className="flex justify-center mb-6">
          <CheckCircle className="h-20 w-20 text-green-500 animate-bounce" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Thank you for your order!
        </h1>
        <p className="text-muted-foreground mb-6 text-sm sm:text-base">
          Your order has been placed successfully. We have sent a confirmation email to{" "}
          <strong className="text-foreground">{formData.email}</strong>.
        </p>
        <div className="bg-muted/50 p-6 rounded-xl border border-border mb-8 text-left space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Order ID:</span>
            <span className="font-semibold text-foreground">{orderId}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Payment Method:</span>
            <span className="font-semibold text-foreground">
              {selectedPaymentMethod === "cash" ? "Cash on Delivery" : "Bank Transfer / UPI"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping Address:</span>
            <span className="font-medium text-foreground text-right">
              {formData.firstName} {formData.lastName}<br />
              {formData.address}<br />
              {formData.city}, {formData.state} {formData.zipCode}
            </span>
          </div>
          <div className="flex justify-between pt-3 border-t border-border/60 text-sm sm:text-base">
            <span className="text-muted-foreground font-medium">
              {selectedPaymentMethod === "cash" ? "Amount to Pay (COD):" : "Amount Paid:"}
            </span>
            <span className="font-bold text-primary">₹{amountPaid.toFixed(2)}</span>
          </div>
        </div>
        
        {selectedPaymentMethod === "bank" && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs sm:text-sm text-amber-800">
            <p className="font-semibold mb-1">Note regarding bank transfer:</p>
            <p>Your order will be processed once we verify the receipt of your payment (total: <strong>₹{amountPaid.toFixed(2)}</strong>) in our bank. We will contact you shortly to confirm.</p>
          </div>
        )}

        <Button size="lg" className="w-full bg-primary text-primary-foreground" asChild>
          <Link href="/">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">Your cart is empty</h1>
        <p className="text-muted-foreground mb-6">
          Add some products to your cart before checking out.
        </p>
        <Button asChild>
          <Link href="/">Go to Shop</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Checkout</h1>
          <p className="text-muted-foreground mt-2">
            Securely complete your purchase
          </p>
        </div>
        <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
          <Link href="/cart" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
        {/* Checkout Forms (Shipping & Payment) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Shipping Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    First Name
                  </label>
                  <Input
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="John"
                    className={errors.firstName ? "border-destructive" : ""}
                  />
                  {errors.firstName && (
                    <p className="text-xs text-destructive">{errors.firstName}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Last Name
                  </label>
                  <Input
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Doe"
                    className={errors.lastName ? "border-destructive" : ""}
                  />
                  {errors.lastName && (
                    <p className="text-xs text-destructive">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Email Address
                </label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john.doe@example.com"
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Street Address
                </label>
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="123 Main St, Apt 4B"
                  className={errors.address ? "border-destructive" : ""}
                />
                {errors.address && (
                  <p className="text-xs text-destructive">{errors.address}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    City
                  </label>
                  <Input
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="New York"
                    className={errors.city ? "border-destructive" : ""}
                  />
                  {errors.city && (
                    <p className="text-xs text-destructive">{errors.city}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    State / Region
                  </label>
                  <Input
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="NY"
                    className={errors.state ? "border-destructive" : ""}
                  />
                  {errors.state && (
                    <p className="text-xs text-destructive">{errors.state}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Zip / Postal Code
                  </label>
                  <Input
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    placeholder="10001"
                    className={errors.zipCode ? "border-destructive" : ""}
                  />
                  {errors.zipCode && (
                    <p className="text-xs text-destructive">{errors.zipCode}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Select Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cash")}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-xl border-2 text-center transition-all duration-200 gap-2 cursor-pointer",
                    paymentMethod === "cash"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-gray-300 bg-background text-muted-foreground"
                  )}
                >
                  <Truck className="h-6 w-6" />
                  <span className="font-semibold text-sm">Cash on Delivery</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("bank")}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-xl border-2 text-center transition-all duration-200 gap-2 cursor-pointer",
                    paymentMethod === "bank"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-gray-300 bg-background text-muted-foreground"
                  )}
                >
                  <CreditCard className="h-6 w-6" />
                  <span className="font-semibold text-sm">Bank Transfer / UPI</span>
                </button>
              </div>

              {paymentMethod === "cash" ? (
                <div className="p-4 bg-muted/40 border border-border rounded-xl text-xs sm:text-sm text-muted-foreground leading-relaxed animate-in fade-in duration-200">
                  <p className="font-medium text-foreground mb-1">Cash on Delivery (COD)</p>
                  <p>Pay with cash when your package is delivered. No upfront payment required. We will verify your details and contact you to confirm the delivery.</p>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-4 bg-muted/30 border border-border rounded-xl flex flex-col items-center">
                    <p className="font-semibold text-foreground text-sm sm:text-base text-center mb-3">Scan QR to Pay via UPI</p>
                    <div className="relative w-full max-w-[280px] bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden p-3 flex flex-col items-center">
                      <Image
                        src="/images/qr-code.png"
                        alt="UPI QR Code"
                        width={240}
                        height={480}
                        className="object-contain w-full h-auto rounded-lg"
                      />
                    </div>
                    <div className="mt-4 text-center space-y-1">
                      <p className="text-sm font-bold text-foreground">
                        UPI ID: <span className="text-primary select-all">9426880068@kotak</span>
                      </p>
                      <p className="text-xs text-muted-foreground font-medium">
                        Payee Name: ADNAN IBADULLAH ARODIYA
                      </p>
                      <p className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full inline-block mt-2">
                        Add Order ID or your name in the payment description note
                      </p>
                    </div>
                  </div>

                  <div className={cn(
                    "flex items-start gap-3 p-3 border rounded-xl transition-all",
                    confirmPaid ? "bg-primary/5 border-primary/20" : "bg-background border-border"
                  )}>
                    <input
                      type="checkbox"
                      id="confirmPaid"
                      checked={confirmPaid}
                      onChange={(e) => {
                        setConfirmPaid(e.target.checked);
                        if (errors.confirmPaid) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.confirmPaid;
                            return next;
                          });
                        }
                      }}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                    />
                    <label htmlFor="confirmPaid" className="text-xs sm:text-sm font-medium text-foreground leading-normal cursor-pointer select-none">
                      Are you sure you&apos;ve paid? I confirm that I have scanned the QR code and completed the payment transfer.
                    </label>
                  </div>
                  {errors.confirmPaid && (
                    <p className="text-xs text-destructive font-medium">{errors.confirmPaid}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column Order Summary */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Your Order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Product items in checkout */}
              <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-3 text-sm">
                    <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0 border border-border">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="font-medium text-foreground truncate">{item.name}</h4>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-semibold text-foreground flex-shrink-0">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Cost Summary */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-medium text-foreground">₹{subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 font-semibold">
                    <span>10% Instant Discount</span>
                    <span>-₹{discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span className="font-medium text-foreground">
                    {shipping === 0 ? "Free" : `₹${shipping.toFixed(2)}`}
                  </span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span className="font-bold text-primary">₹{total.toFixed(2)}</span>
                </div>
              </div>

              {/* Order Submission Button */}
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-4"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : paymentMethod === "cash" ? (
                  `Place Order ₹${total.toFixed(2)}`
                ) : (
                  `I've Paid - Complete Order`
                )}
              </Button>

              <div className="space-y-2 pt-4 border-t border-border text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                  <span>Secure SSL Checkout (AES-256 encrypted)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                  <span>Prompt fulfillment & tracked delivery</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
