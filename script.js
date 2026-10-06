// =========================================================
// SUPABASE CONNECTION
// =========================================================

const supabaseUrl = "https://kmhuytrqygpskmvcyimd.supabase.co";

const supabaseKey =
    "sb_publishable_rTnXNzLaXZ0hPGhsQJfT2Q_o9bCY0bN";

const supabaseClient = window.supabase.createClient(
    supabaseUrl,
    supabaseKey
);


// =========================================================
// SERVICE NORMALIZATION
// =========================================================

function normalizeServiceName(text) {

    let name = (text || "")
        .replace(/\s*—.*$/, "")
        .trim()
        .replaceAll("’", "'");

    const serviceMap = {

        "Keratin/Smoothing Treatment":
            "Keratin/Smoothing",

        "Deep Conditioning Treatment":
            "Deep Conditioning"

    };

    return serviceMap[name] || name;
}


// =========================================================
// SERVICE DURATIONS
// =========================================================

const serviceDurations = {

    "Men's Haircut": 30,
    "Skin Fade": 40,
    "Haircut + Beard": 60,
    "Women's Haircut": 60,
    "Kids Haircut": 30,

    "Root Touch-Up": 120,
    "Full Color": 150,
    "Toner/Gloss": 60,

    "Balayage": 240,
    "Highlights": 240,
    "Full Highlights": 240,
    "Color Correction": 180,

    "Hair Botox": 180,
    "Keratin/Smoothing": 240,
    "Deep Conditioning": 60,

    "Blow Dry": 60,
    "Curls/Waves": 60,
    "Special Occasion Styling": 90,
    "Scalp Treatment": 60,

    "Male Perm": 180,
    "Female Perm": 180
};


// =========================================================
// ELEMENTS
// =========================================================

const dateInput = document.getElementById("date");
const timeInput = document.getElementById("time");
const serviceInput = document.getElementById("service");


// =========================================================
// SERVICE BOOK BUTTONS
// =========================================================

const bookButtons =
    document.querySelectorAll(".service-right button");

const serviceSelect =
    document.getElementById("service");


bookButtons.forEach((button) => {

    button.addEventListener("click", () => {

        const serviceItem =
            button.closest(".service-item");

        if (!serviceItem) return;

        const rawServiceName =
            serviceItem.querySelector("h4")?.textContent || "";

        const serviceName =
            normalizeServiceName(rawServiceName);


        // Find matching option
        const matchingOption =
            [...serviceSelect.options].find((option) => {

                return (
                    normalizeServiceName(option.textContent) ===
                    serviceName
                );

            });


        if (matchingOption) {

            serviceSelect.value =
                matchingOption.value;

            // Trigger slot loading
            serviceSelect.dispatchEvent(
                new Event("change", {
                    bubbles: true
                })
            );

        }


        // Scroll to booking
        const bookingSection =
            document.getElementById("booking");

        if (bookingSection) {

            bookingSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }

    });

});


// =========================================================
// MOBILE MENU
// =========================================================

const menuToggle =
    document.getElementById("menu-toggle");

const mainNav =
    document.getElementById("main-nav");


if (menuToggle && mainNav) {

    menuToggle.addEventListener("click", () => {

        mainNav.classList.toggle("active");

    });


    mainNav.querySelectorAll("a").forEach((link) => {

        link.addEventListener("click", () => {

            mainNav.classList.remove("active");

        });

    });

}


// =========================================================
// PREVENT PAST DATES
// =========================================================

if (dateInput) {

    const today =
        new Date().toISOString().split("T")[0];

    dateInput.setAttribute("min", today);

}


// =========================================================
// LOAD AVAILABLE SLOTS
// =========================================================

async function loadAvailableSlots() {

    const selectedDate =
        dateInput?.value;

    const selectedOption =
        serviceInput?.options[
            serviceInput.selectedIndex
        ];


    // Reset time dropdown

    if (timeInput) {

        timeInput.innerHTML =
            '<option value="">Select an available time</option>';

    }


    if (!selectedDate || !selectedOption) {

        return;

    }


    // Get clean service name

    const selectedServiceName =
        normalizeServiceName(
            selectedOption.textContent
        );


    // Get duration

    const duration =
        serviceDurations[selectedServiceName] || 30;


    console.log(
        "Loading slots:",
        selectedDate,
        selectedServiceName,
        duration
    );


    try {

        // =====================================================
        // SUPABASE REQUEST
        // =====================================================

        const url = new URL(
            "https://kmhuytrqygpskmvcyimd.supabase.co/rest/v1/slots"
        );


        url.searchParams.set(
            "select",
            "start_time,end_time,status,service"
        );


        url.searchParams.set(
            "slot_date",
            `eq.${selectedDate}`
        );


        url.searchParams.set(
            "status",
            "eq.available"
        );


        url.searchParams.set(
            "service",
            `eq.${selectedServiceName}`
        );


        url.searchParams.set(
            "order",
            "start_time.asc"
        );


        const response =
            await fetch(url.toString(), {

                method: "GET",

                headers: {

                    apikey: supabaseKey,

                    Authorization:
                        `Bearer ${supabaseKey}`

                }

            });


        const allSlots =
            await response.json();


        // =====================================================
        // ERROR
        // =====================================================

        if (!response.ok) {

            console.error(
                "Supabase slot error:",
                allSlots
            );

            timeInput.innerHTML =
                '<option value="">Unable to load slots</option>';

            return;

        }


        console.log(
            "Slots received:",
            allSlots
        );


        // =====================================================
        // TIME FUNCTIONS
        // =====================================================

        function timeToMinutes(time) {

            const parts =
                time.split(":").map(Number);

            return (
                parts[0] * 60 +
                parts[1]
            );

        }


        function minutesToTime(totalMinutes) {

            const hours =
                Math.floor(totalMinutes / 60);

            const minutes =
                totalMinutes % 60;

            return (
                String(hours).padStart(2, "0") +
                ":" +
                String(minutes).padStart(2, "0")
            );

        }


        function formatDisplayTime(time) {

            const parts =
                time.split(":").map(Number);

            const hours = parts[0];

            const minutes = parts[1];

            const suffix =
                hours >= 12 ? "PM" : "AM";

            const displayHour =
                hours % 12 || 12;

            return (
                `${displayHour}:` +
                `${String(minutes).padStart(2, "0")} ` +
                `${suffix}`
            );

        }


        // =====================================================
        // CONVERT SUPABASE SLOTS
        // =====================================================

        const availableTimes =
            allSlots.map((slot) => ({

                start:
                    timeToMinutes(slot.start_time),

                end:
                    timeToMinutes(slot.end_time),

                startTime:
                    slot.start_time,

                endTime:
                    slot.end_time

            }));


        // =====================================================
        // REQUIRED 30-MINUTE BLOCKS
        // =====================================================

        const requiredBlocks =
            Math.ceil(duration / 30);


        // =====================================================
        // FIND VALID START TIMES
        // =====================================================

        const validStartTimes = [];


        availableTimes.forEach((slot) => {

            let valid = true;


            for (
                let i = 0;
                i < requiredBlocks;
                i++
            ) {

                const requiredStart =
                    slot.start + (i * 30);


                const nextSlot =
                    availableTimes.find(
                        (s) =>
                            s.start === requiredStart
                    );


                if (!nextSlot) {

                    valid = false;

                    break;

                }

            }


            if (valid) {

                validStartTimes.push(slot);

            }

        });


        // =====================================================
        // NO AVAILABLE SLOTS
        // =====================================================

        if (validStartTimes.length === 0) {

            timeInput.innerHTML =
                '<option value="">No suitable time available</option>';

            return;

        }


        // =====================================================
        // DISPLAY SLOTS
        // =====================================================

        validStartTimes.forEach((slot) => {

            const option =
                document.createElement("option");


            option.value =
                slot.startTime;


            const appointmentEnd =
                slot.start + duration;


            const startDisplay =
                formatDisplayTime(
                    slot.startTime
                );


            const endDisplay =
                formatDisplayTime(
                    minutesToTime(
                        appointmentEnd
                    )
                );


            option.textContent =
                `${startDisplay} – ${endDisplay}`;


            timeInput.appendChild(option);

        });


        console.log(
            "Service:",
            selectedServiceName,
            "| Duration:",
            duration,
            "| Valid slots:",
            validStartTimes
        );

    }

    catch (error) {

        console.error(
            "Slot loading error:",
            error
        );


        timeInput.innerHTML =
            '<option value="">Unable to load slots</option>';

    }

}


// =========================================================
// SLOT EVENT LISTENERS
// =========================================================

if (dateInput) {

    dateInput.addEventListener(
        "change",
        loadAvailableSlots
    );

}


if (serviceInput) {

    serviceInput.addEventListener(
        "change",
        loadAvailableSlots
    );

}


// =========================================================
// BOOKING FORM
// =========================================================

const bookingForm =
    document.querySelector(".booking-form");


if (bookingForm) {

    bookingForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            // =================================================
            // GET FORM VALUES
            // =================================================

            const name =
                document
                    .getElementById("name")
                    .value
                    .trim();


            const phone =
                document
                    .getElementById("phone")
                    .value
                    .trim();


            const serviceRaw =
                serviceInput.value;


            const selectedOption =
                serviceInput.options[
                    serviceInput.selectedIndex
                ];


            const service =
                normalizeServiceName(
                    selectedOption?.textContent ||
                    serviceRaw
                );


            const date =
                dateInput.value;


            const time =
                timeInput.value;


            const message =
                document
                    .getElementById("message")
                    .value
                    .trim();


            // =================================================
            // VALIDATION
            // =================================================

            if (name.length < 2) {

                alert(
                    "Please enter your name."
                );

                return;

            }


            if (
                !/^[0-9+\-\s()]{7,20}$/.test(
                    phone
                )
            ) {

                alert(
                    "Please enter a valid phone number."
                );

                return;

            }


            if (!service) {

                alert(
                    "Please select a service."
                );

                return;

            }


            if (!date) {

                alert(
                    "Please select a preferred date."
                );

                return;

            }


            if (!time) {

                alert(
                    "Please select a preferred time."
                );

                return;

            }


            // =================================================
            // SAVE BOOKING
            // =================================================

            try {

                const bookingResponse =
                    await fetch(

                        "https://kmhuytrqygpskmvcyimd.supabase.co/rest/v1/bookings",

                        {

                            method: "POST",

                            headers: {

                                apikey:
                                    supabaseKey,

                                Authorization:
                                    "Bearer " +
                                    supabaseKey,

                                "Content-Type":
                                    "application/json",

                                Prefer:
                                    "return=minimal"

                            },

                            body:
                                JSON.stringify({

                                    customer_name:
                                        name,

                                    phone:
                                        phone,

                                    service:
                                        service,

                                    booking_date:
                                        date,

                                    start_time:
                                        time,

                                    notes:
                                        message || null,

                                    status:
                                        "pending"

                                })

                        }

                    );


                const bookingResult =
                    await bookingResponse.text();


                // =================================================
                // BOOKING ERROR
                // =================================================

                if (!bookingResponse.ok) {

                    console.error(
                        "Booking error:",
                        bookingResult
                    );


                    alert(
                        "Unable to submit booking. Please try again."
                    );


                    return;

                }


                // =================================================
                // SUCCESS
                // =================================================

                alert(
                    "Appointment request submitted successfully!"
                );


                bookingForm.reset();


                timeInput.innerHTML =
                    '<option value="">Select an available time</option>';

            }

            catch (error) {

                console.error(
                    "Booking request error:",
                    error
                );


                alert(
                    "Unable to submit booking. Please try again."
                );

            }

        }

    );

}


// =========================================================
// GALLERY
// =========================================================

const gallerySupabaseUrl =
    "https://kmhuytrqygpskmvcyimd.supabase.co";


const gallerySupabaseKey =
    "sb_publishable_rTnXNzLaXZ0hPGhsQJfT2Q_o9bCY0bN";


const galleryClient =
    window.supabase.createClient(
        gallerySupabaseUrl,
        gallerySupabaseKey
    );


async function loadGallery() {

    const galleryGrid =
        document.getElementById(
            "galleryGrid"
        );


    if (!galleryGrid) return;


    const {
        data: files,
        error
    } =
        await galleryClient
            .storage
            .from("gallery")
            .list("", {

                limit: 100,

                sortBy: {

                    column: "created_at",

                    order: "desc"

                }

            });


    if (error) {

        console.error(
            "Gallery loading error:",
            error
        );


        galleryGrid.innerHTML = `
            <div class="gallery-loading">
                Unable to load gallery.
            </div>
        `;


        return;

    }


    const imageFiles =
        (files || []).filter(
            (file) =>
                file.name &&
                !file.name.startsWith(".") &&
                !file.name.startsWith("__about__")
        );


    if (imageFiles.length === 0) {

        galleryGrid.innerHTML = `
            <div class="gallery-loading">
                Gallery photos coming soon.
            </div>
        `;


        return;

    }


    galleryGrid.innerHTML = "";


    imageFiles.forEach(
        (file, index) => {

            const {
                data: publicUrlData
            } =
                galleryClient
                    .storage
                    .from("gallery")
                    .getPublicUrl(
                        file.name
                    );


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "gallery-card" +
                (
                    index % 5 === 0
                        ? " large"
                        : ""
                );


            card.innerHTML = `
                <img
                    src="${publicUrlData.publicUrl}"
                    alt="Ammy Blendz"
                    loading="lazy"
                >
            `;


            galleryGrid.appendChild(
                card
            );

        }
    );

}


// =========================================================
// LOAD GALLERY
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    loadGallery
);


// =========================================================
// ABOUT PAGE PHOTO
// =========================================================

async function loadAboutPhoto() {

    const aboutImage =
        document.querySelector(
            ".about-image"
        );


    if (!aboutImage) return;


    const {
        data,
        error
    } =
        await supabaseClient
            .from("gallery_photos")
            .select("image_url")
            .eq(
                "file_name",
                "__about__"
            )
            .maybeSingle();


    if (error) {

        console.error(
            "About photo loading error:",
            error
        );


        return;

    }


    if (!data || !data.image_url) {

        return;

    }


    aboutImage.innerHTML = `
        <img
            src="${data.image_url}"
            alt="Ammy Blendz"
            loading="lazy"
        >
    `;

}


// =========================================================
// LOAD ABOUT PHOTO
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    loadAboutPhoto
);