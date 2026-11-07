/**
 *  infiniteSlide
 *  updateClock
 *  cursorTrail
 *  goTop
 *  settingColor
 *  openMbMenu
 *  switchPrice
 *  services_btn
 *  counter
 *  dot
 *  viewbox
 */

(function ($) {
    "use strict";

    /* Go Top (rAF-throttled & passive scroll listener)
    -------------------------------------------------------------------------*/
    var goTop = function () {
        var $goTop = $("#goTop");
        var borderProgressEl = document.querySelector("#goTop .border-progress");
        var goTopTicking = false;

        var updateGoTop = function () {
            var scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
            var docHeight = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
            var progressAngle = Math.min(360, Math.max(0, (scrollTop / docHeight) * 360));

            if (borderProgressEl) {
                borderProgressEl.style.setProperty("--progress-angle", progressAngle.toFixed(1) + "deg");
            }

            if (scrollTop > 100) {
                $goTop.addClass("show");
            } else {
                $goTop.removeClass("show");
            }
            goTopTicking = false;
        };

        window.addEventListener(
            "scroll",
            function () {
                if (!goTopTicking) {
                    goTopTicking = true;
                    requestAnimationFrame(updateGoTop);
                }
            },
            { passive: true }
        );

        $goTop.on("click", function () {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    };
    /* Infinite Slide (Capped clone count to minimize GPU texture width)
    -------------------------------------------------------------------------*/
    var infiniteSlide = function () {
        if ($(".infiniteSlide").length > 0) {
            $(".infiniteSlide").each(function () {
                var $this = $(this);
                var style = $this.data("style") || "left";
                var clone = Math.min(parseInt($this.data("clone"), 10) || 2, 2);
                var speed = $this.data("speed") || 50;
                $this.infiniteslide({
                    speed: speed,
                    direction: style,
                    clone: clone,
                    pauseonhover: false,
                });
            });
        }
    };
    /* Update Clock (Low-frequency update & skip when offcanvas is closed)
    -------------------------------------------------------------------------*/
    var updateClock = () => {
        function startClocks(selector = ".clock") {
            const nodes = document.querySelectorAll(selector);
            if (!nodes.length) return;
            function tickClock() {
                if (document.hidden) return;
                const now = new Date();
                const timeString = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
                nodes.forEach((el) => {
                    if (el.textContent !== timeString) {
                        el.textContent = timeString;
                    }
                });
            }
            tickClock();
            setInterval(tickClock, 30000);
        }

        startClocks(".clock");
    };
    /* Cursor Trail
    -------------------------------------------------------------------------*/
    var cursorTrail = () => {
        const canvas = document.getElementById("trail");
        if (canvas) {
            canvas.remove();
        }
    };
    /* Setting Color
    -------------------------------------------------------------------------*/
    const settingColor = () => {
        if (!$(".settings-color").length) return;

        const COLOR_KEY = "selectedColorIndex";

        const savedIndex = localStorage.getItem(COLOR_KEY);

        if (savedIndex !== null) {
            setColor(savedIndex);
            setActiveItem(savedIndex - 1);
        }

        $(".choose-item").on("click", function () {
            const index = $(this).index();
            setColor(index + 1);
            setActiveItem(index);
            localStorage.setItem(COLOR_KEY, index + 1);
        });

        function setColor(index) {
            $("body").attr("data-color-primary", "color-primary-" + index);
        }

        function setActiveItem(index) {
            $(".choose-item").removeClass("active").eq(index).addClass("active");
        }
    };
    /* Open Menu
    -------------------------------------------------------------------------*/
    var openMbMenu = () => {
        $(".open-mb-menu").on("click", function () {
            $(".offcanvas-menu").addClass("show");
            $("body").toggleClass("overflow-hidden");
        });

        $(".close-mb-menu").on("click", function () {
            $(".offcanvas-menu").removeClass("show");
            $("body").toggleClass("overflow-hidden");
        });
    };
    /* switchprice
    -------------------------------------------------------------------------*/
    var switchPrice = () => {
        function formatUSD(n) {
            return "$" + Number(n).toLocaleString("en-US");
        }

        function updatePrices(isYearly) {
            $(".price-number").each(function () {
                const $p = $(this);
                const val = isYearly ? $p.data("year") : $p.data("month");
                $p.text($p.attr(isYearly ? "data-year-text" : "data-month-text") || formatUSD(val));
                const $per = $p.next(".price-per");
                $per.text(
                    $p.attr(isYearly ? "data-year-per" : "data-month-per") ||
                        $per.attr(isYearly ? "data-year-per" : "data-month-per") ||
                        (isYearly ? "/ 연간 라이선스" : "/ 초기 도입")
                );
            });
        }

        $("#pricingSwitch").on("change", function () {
            updatePrices(this.checked);
        });

        if ($("#pricingSwitch").is(":checked")) {
            updatePrices(true);
        } else {
            updatePrices(false);
        }
    };
    /* services_btn
    -------------------------------------------------------------------------*/
    var services_btn = () => {
        $(".services-image-btn").on("click", function () {
            const targetId = $(this).attr("data-bs-target") || "";
            const isBottomSlot = targetId === "#faq-3" || targetId === "#faq-4";
            const $leftCol = $(this).closest(".row").find(".services-image").parent();
            const $servicesImg = $leftCol.find(".services-image");
            const $masterCard = $leftCol.children().not(".services-image").first();

            const wasBottomSlot = $leftCol.hasClass("services-stack-swapped");
            if (isBottomSlot !== wasBottomSlot && $servicesImg.length && $masterCard.length) {
                const firstImgTop = $servicesImg[0].getBoundingClientRect().top;
                const firstMasterTop = $masterCard[0].getBoundingClientRect().top;

                $leftCol.toggleClass("services-stack-swapped", isBottomSlot);
                if (isBottomSlot) {
                    $servicesImg.css("order", 2);
                    $masterCard.css("order", 1);
                } else {
                    $servicesImg.css("order", 1);
                    $masterCard.css("order", 2);
                }

                const lastImgTop = $servicesImg[0].getBoundingClientRect().top;
                const lastMasterTop = $masterCard[0].getBoundingClientRect().top;
                const deltaImg = firstImgTop - lastImgTop;
                const deltaMaster = firstMasterTop - lastMasterTop;

                if (Math.abs(deltaImg) > 4) {
                    $servicesImg[0].style.transition = "none";
                    $masterCard[0].style.transition = "none";
                    $servicesImg[0].style.transform = `translateY(${deltaImg}px)`;
                    $masterCard[0].style.transform = `translateY(${deltaMaster}px)`;
                    void $servicesImg[0].offsetHeight;
                    $servicesImg[0].style.transition = "transform 0.44s cubic-bezier(0.22, 1, 0.36, 1)";
                    $masterCard[0].style.transition = "transform 0.44s cubic-bezier(0.22, 1, 0.36, 1)";
                    $servicesImg[0].style.transform = "translateY(0)";
                    $masterCard[0].style.transform = "translateY(0)";
                }
            }

            if (!$(this).hasClass("active-img")) {
                $(".services-image-btn").removeClass("active-img");
                $(this).addClass("active-img");

                const newImg = $(this).data("img");
                $(".services-image").find("img").css("opacity", 0);
                setTimeout(() => {
                    $(".services-image").find("img").attr("src", newImg).css("opacity", 1);
                }, 200);
            }
        });
    };
    // counter
    var counter = function () {
        if ($(document.body).hasClass("counter-scroll")) {
            var a = 0;
            window.addEventListener(
                "scroll",
                function () {
                    if (a !== 0 || !$(".counter").length) return;
                    var oTop = $(".counter").offset().top - window.innerHeight;
                    if ((window.pageYOffset || document.documentElement.scrollTop) > oTop) {
                        if ($().countTo) {
                            $(".counter")
                                .find(".number")
                                .each(function () {
                                    var to = $(this).data("to"),
                                        speed = $(this).data("speed");
                                    $(this).countTo({
                                        to: to,
                                        speed: speed,
                                    });
                                });
                        }
                        a = 1;
                    }
                },
                { passive: true }
            );
        }
    };
    // dot
    var dot = function () {
        document.querySelectorAll(".pagi-dot").forEach((pagi) => {
            const dots = pagi.querySelectorAll("span");
            const activeIndex = [...dots].findIndex((dot) => dot.classList.contains("active"));
            dots.forEach((dot) => dot.classList.remove("active"));
            ScrollTrigger.create({
                trigger: pagi,
                start: "top 95%",
                once: true,
                onEnter: () => {
                    dots.forEach((dot, index) => {
                        if (index <= activeIndex) {
                            gsap.delayedCall(index * 0.4, () => {
                                dots.forEach((d) => d.classList.remove("active"));
                                dot.classList.add("active");
                            });
                        }
                    });
                },
            });
        });
    };
    // viewbox
    var viewbox = function () {
        document.querySelectorAll("svg[data-viewbox-desktop]").forEach((svg) => {
            const desktopViewBox = svg.dataset.viewboxDesktop;
            const mobileViewBox = svg.dataset.viewboxMobile;
            const mq = window.matchMedia("(max-width: 767px)");
            const updateViewBox = (e) => {
                svg.setAttribute("viewBox", e.matches ? mobileViewBox : desktopViewBox);
            };
            updateViewBox(mq);
            mq.addEventListener("change", updateViewBox);
        });
    };

    // Dom Ready
    $(function () {
        infiniteSlide();
        updateClock();
        cursorTrail();
        goTop();
        settingColor();
        openMbMenu();
        switchPrice();
        services_btn();
        counter();
        dot();
        viewbox();
    });
})(jQuery);
