document.documentElement.classList.add("js-enabled");

const body = document.body;
const header = document.querySelector("[data-site-header]");
const navToggle = document.querySelector("[data-nav-toggle]");
const siteNav = document.querySelector("[data-site-nav]");
const form = document.querySelector("[data-consult-form]");
const formStatus = document.querySelector("[data-form-status]");
const year = document.querySelector("[data-current-year]");
const inquiryConfig = {
  family: {
    title: "부모님 서비스 상담하기",
    description: "남겨주신 내용을 바탕으로 부모님의 상황에 맞는 이용 방식과 가능 여부를 안내드립니다.",
    messageLabel: "부모님 상황 또는 상담 희망 내용",
    messageHint: "현재 부모님 상황, 가장 걱정되는 점, 희망 지역 또는 상담 내용을 적어주시면 더 빠르게 안내드릴 수 있습니다.",
    messagePlaceholder:
      "예: 부산 해운대구 거주 / 혼자 지내시는 시간이 길고 최근 다리 힘이 약해지셨습니다 / 낙상과 운동 부족이 걱정됩니다 / 주 1~2회 방문 가능 여부를 상담받고 싶습니다.",
    showPartnerField: false,
  },
  partner: {
    title: "기관·병원 협력 문의하기",
    description: "남겨주신 내용을 바탕으로 협력 가능 방식과 초기 안내 사항을 확인해드립니다.",
    messageLabel: "기관 정보 및 협력 문의 내용",
    messageHint: "기관명, 담당 부서 또는 역할, 협력 목적, 연계하려는 대상자 특성을 함께 적어주시면 검토에 도움이 됩니다.",
    messagePlaceholder:
      "예: 부산 ○○병원 퇴원지원팀 / 퇴원 후 재가 회복이 필요한 고령 환자 연계 가능 여부 문의 / 대상자 특성과 협력 방식, 회신 절차를 안내받고 싶습니다.",
    showPartnerField: true,
  },
};

const updateHeader = () => {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 12);
};

if (year) {
  year.textContent = new Date().getFullYear();
}

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = body.classList.toggle("nav-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  siteNav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      body.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      body.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });
}

if (form) {
  const typeSelect = form.querySelector("[data-inquiry-type]");
  const title = form.querySelector("[data-form-title]");
  const description = form.querySelector("[data-form-description]");
  const messageLabel = form.querySelector("[data-message-label]");
  const messageHint = form.querySelector("[data-message-hint]");
  const messageField = form.querySelector("[data-message-field]");
  const partnerField = form.querySelector("[data-partner-field]");

  const setInquiryType = (type = "family") => {
    const config = inquiryConfig[type] || inquiryConfig.family;

    if (typeSelect) typeSelect.value = type;
    if (title) title.textContent = config.title;
    if (description) description.textContent = config.description;
    if (messageLabel) messageLabel.textContent = config.messageLabel;
    if (messageHint) messageHint.textContent = config.messageHint;
    if (messageField) messageField.placeholder = config.messagePlaceholder;
    if (partnerField) {
      const organizationInput = partnerField.querySelector("input");
      partnerField.hidden = !config.showPartnerField;

      if (organizationInput) {
        organizationInput.disabled = !config.showPartnerField;
        if (!config.showPartnerField) organizationInput.value = "";
      }
    }
  };

  const requestedType = new URLSearchParams(window.location.search).get("type");
  setInquiryType(requestedType === "partner" ? "partner" : typeSelect?.value || "family");

  typeSelect?.addEventListener("change", () => {
    setInquiryType(typeSelect.value);
  });

  document.querySelectorAll("[data-consult-type]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      setInquiryType(trigger.dataset.consultType);
    });
  });
}

if (form && formStatus) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = "접수 중...";
    submitBtn.disabled = true;
    formStatus.textContent = "";

    const formData = new FormData(form);
    const payload = {
      type: formData.get("type"),
      name: formData.get("name"),
      phone: formData.get("phone"),
      organization: formData.get("organization") || "",
      region: formData.get("region"),
      message: formData.get("message"),
      privacy_agreed: formData.get("privacy") === "on" ? "Y" : "N",
      source_page: "website"
    };

    try {
      const response = await fetch("https://script.google.com/macros/s/AKfycbwQqZEptYyMhbT-JiBBSmFZO4rs2KRBpvFEuO_7pzDkMyPlb5co8fzpHVBXk3xYsgOB/exec", {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        formStatus.textContent = "상담 요청이 정상적으로 접수되었습니다.";
        formStatus.style.color = ""; // CSS 기본색(accent-deep) 사용
        form.reset();
        const typeSelect = form.querySelector("[data-inquiry-type]");
        if (typeSelect) {
          typeSelect.dispatchEvent(new Event("change"));
        }
      } else {
        throw new Error("Server error");
      }
    } catch (error) {
      formStatus.textContent = "전송에 실패했습니다. 잠시 후 다시 시도해주세요.";
      formStatus.style.color = "#d93025";
    } finally {
      submitBtn.textContent = originalBtnText;
      submitBtn.disabled = false;
    }
  });
}

const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  revealItems.forEach((item) => {
    if (item.getBoundingClientRect().top < window.innerHeight * 0.92) {
      item.classList.add("is-visible");
    }
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -80px" }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}
