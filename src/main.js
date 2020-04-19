import SignaturePad from "signature_pad";
import { disableBodyScroll, enableBodyScroll } from "body-scroll-lock";

class Inputs {
  principalName;
  partnerName;

  constructor() {
    this.today = new Date();

    document.querySelectorAll("input[type='date']").forEach((input) => {
      input.value = this.getTodayValue();
    });

    this.updateName("principal-name", "Principal");
    this.updateName("partner-name", "Partner");
  }

  updateName = (fromInputLabel, defaultValue) => {
    const updateInnerTextClassList = document.getElementsByClassName(
      fromInputLabel
    );
    const updateInnerText = (text) => {
      Array.from(updateInnerTextClassList).forEach((el) => {
        const value = text || defaultValue;
        el.innerText = value;
      });
    };
    document.getElementById(fromInputLabel).addEventListener("input", (ev) => {
      updateInnerText(ev.currentTarget.innerText);
    });
    updateInnerText(document.getElementById(fromInputLabel).innerText);
  };

  getReadableDate = () =>
    `${this.todayMonth}/${this.todayDay}/${this.today.getFullYear()}`;

  getTodayValue = () => `${this.todayYear}-${this.todayMonth}-${this.todayDay}`;

  get todayYear() {
    return this.today.getFullYear();
  }

  get todayMonth() {
    return ("0" + (this.today.getMonth() + 1)).slice(-2);
  }

  get todayDay() {
    return ("0" + this.today.getDate()).slice(-2);
  }
}

class Signature {
  container;
  canvas;
  signaturePad;
  lastSignedBy;
  signatureDrawings = {};

  constructor() {
    this.container = document.querySelector("#signature");
    this.canvas = this.container.querySelector("canvas");
    this.signaturePad = new SignaturePad(this.canvas);

    window.addEventListener("resize", this.resizeCanvas);
    this.resizeCanvas();

    Array.from(document.getElementsByClassName("sign")).forEach((signer) => {
      const button = signer.getElementsByTagName("button")[0];
      button.addEventListener("click", (ev) => this.open(ev.currentTarget.id));
    });

    document
      .getElementById("close-signature")
      .addEventListener("click", this.close);
    document
      .getElementById("clear-signature")
      .addEventListener("click", this.clear);
    document
      .getElementById("save-signature")
      .addEventListener("click", this.save);
  }

  resizeCanvas = () => {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    this.canvas.width = this.canvas.offsetWidth * ratio;
    this.canvas.height = this.canvas.offsetHeight * ratio;
    this.canvas.getContext("2d").scale(ratio, ratio);
    this.clear();
  };

  open = (id) => {
    this.lastSignedBy = id;
    this.container.classList.add("active");
    this.container.addEventListener("click", () => {
      if (this.signaturePad.isEmpty()) this.close();
    });
    this.container
      .querySelector(".modal-body")
      .addEventListener("click", (ev) => {
        ev.stopPropagation();
      });
    disableBodyScroll(this.container);
  };

  save = () => {
    if (!this.signaturePad.isEmpty()) {
      this.signatureDrawings[this.lastSignedBy] = this.signaturePad.toData();
      const signatureImage = this.signaturePad.toDataURL("image/svg+xml");
      this.appendImage(signatureImage);
      this.clear();
      this.close();
    } else {
      this.canvas.style.borderColor = "red";
    }
  };

  appendImage = (src) => {
    const lastSignedBy = this.lastSignedBy;
    const activator = document.getElementById(lastSignedBy);
    const parent = activator.parentElement;
    const button = document.createElement("button");
    button.addEventListener("click", () => {
      this.open(lastSignedBy);
      this.signaturePad.fromData(this.signatureDrawings[lastSignedBy]);
    });
    const img = document.createElement("img");
    button.id = lastSignedBy;
    img.src = src;
    img.style.width = "100%";
    img.alt = activator.name;
    button.appendChild(img);
    parent.innerHTML = "";
    parent.appendChild(button);
  };

  close = () => {
    let shouldClose = true;
    if (
      !this.signaturePad.isEmpty() &&
      !this.signatureDrawings[this.lastSignedBy]
    ) {
      shouldClose = window.confirm(
        "Are you sure you want to close without saving your signature?"
      );
    }
    if (shouldClose) {
      this.container.classList.remove("active");
      this.canvas.style.borderColor = "#999";
      enableBodyScroll(this.container);
      this.clear();
    }
  };

  clear = () => {
    this.signaturePad.clear();
  };
}

new Inputs();
new Signature();
