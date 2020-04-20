import SignaturePad from "signature_pad";
import { disableBodyScroll, enableBodyScroll } from "body-scroll-lock";
import defaults from "./defaults.json";

class Inputs {
  dateInputs;
  nameInputs;

  constructor({ principalName, partnerName, dateEffective, dateSigned }) {
    this.dateInputs = document.querySelectorAll("input[type='date']");
    this.dateInputs.forEach((input) => {
      input.type = "text";
      const date = input.classList.contains("inline-date")
        ? dateEffective
        : dateSigned;
      input.value = this.getReadableDate(date);
      input.onfocus = (ev) => {
        const value = ev.currentTarget.value;
        input.type = "date";
        if (value) input.value = this.getTodayValue(new Date(value));
      };
      input.onblur = (ev) => {
        const value = ev.currentTarget.value;
        input.type = "text";
        if (value) input.value = this.getReadableDate(new Date(value));
      };
    });

    document
      .getElementById("reset-values")
      .addEventListener("click", this.resetInputs);

    document
      .getElementById("print-page")
      .addEventListener("click", this.printPage);

    const principalNameLabel = "principal-name";
    const partnerNameLabel = "partner-name";

    this.nameInputs = [
      [
        document.getElementById(principalNameLabel),
        document.getElementsByClassName(principalNameLabel),
        principalName,
      ],
      [
        document.getElementById(partnerNameLabel),
        document.getElementsByClassName(partnerNameLabel),
        partnerName,
      ],
    ];

    this.nameInputs.forEach(([editableInput, modifyDivs, defaultName]) => {
      editableInput.innerText = defaultName;
      const updateInnerText = (text) => {
        Array.from(modifyDivs).forEach((el) => {
          const placeholder = el.innerText;
          el.innerText = text || defaultName;
          el.dataset.placeholder = placeholder;
        });
      };
      editableInput.addEventListener("input", (ev) => {
        updateInnerText(ev.currentTarget.innerText);
      });
      updateInnerText(defaultName);
    });
  }

  resetInputs = () => {
    this.dateInputs.forEach((input) => {
      input.value = "";
    });
    this.nameInputs.forEach(([editableInput, modifyDivs]) => {
      editableInput.innerText = "";
      Array.from(modifyDivs).forEach((el) => {
        el.innerText = el.dataset.placeholder;
      });
    });
  };

  printPage = () => {
    window.print();
  };

  getReadableDate = (date) =>
    `${this.todayMonth(date)}/${this.todayDay(date)}/${this.todayYear(date)}`;

  getTodayValue = (date) =>
    `${this.todayYear(date)}-${this.todayMonth(date, true)}-${this.todayDay(
      date,
      true
    )}`;

  todayYear = (date) => {
    return date.getFullYear();
  };

  todayMonth = (date, pad) => {
    const month = date.getMonth() + 1;
    return pad ? ("0" + month).slice(-2) : month;
  };

  todayDay = (date, pad) => {
    const day = date.getDate();
    return pad ? ("0" + day).slice(-2) : day;
  };
}

class Signature {
  container;
  canvas;
  signaturePad;
  activeSignatureId;
  signatureDrawings = {};

  constructor({ partnerSignature, principalSignature }) {
    this.container = document.querySelector("#signature");
    this.canvas = this.container.querySelector("canvas");
    this.signaturePad = new SignaturePad(this.canvas);

    window.addEventListener("resize", this.resizeCanvas);
    this.resizeCanvas();

    const signButtonIds = ["partner-sign", "principal-sign"];
    this.signButtons = signButtonIds.map((id) => document.getElementById(id));

    this.setupSignButtons();

    const defaultSignatures = [partnerSignature, principalSignature];
    signButtonIds.forEach((buttonId, index) => {
      const signatureData = defaultSignatures[index];
      this.signatureDrawings[buttonId] = signatureData;
      this.signaturePad.fromData(signatureData);
      const signatureImage = this.signaturePad.toDataURL("image/svg+xml");
      this.appendImage(signatureImage, buttonId);
      this.clear();
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

    document
      .getElementById("reset-values")
      .addEventListener("click", this.resetSignatures);
  }

  setupSignButtons = () => {
    this.signButtons.forEach((button) => {
      button.onclick = (ev) => {
        this.open(ev.currentTarget.id);
      };
    });
  };

  resizeCanvas = () => {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    this.canvas.width = this.canvas.offsetWidth * ratio;
    this.canvas.height = this.canvas.offsetHeight * ratio;
    this.canvas.getContext("2d").scale(ratio, ratio);
    this.clear();
  };

  open = (id) => {
    this.activeSignatureId = id;
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
      this.signatureDrawings[
        this.activeSignatureId
      ] = this.signaturePad.toData();
      const signatureImage = this.signaturePad.toDataURL("image/svg+xml");
      this.appendImage(signatureImage, this.activeSignatureId);
      this.clear();
      this.close();
    } else {
      this.canvas.style.borderColor = "red";
    }
  };

  appendImage = (src, buttonId) => {
    const button = document.getElementById(buttonId);
    button.classList.add("img");
    button.classList.remove("no-print");
    button.onclick = () => {
      this.open(buttonId);
      this.signaturePad.fromData(this.signatureDrawings[buttonId]);
    };
    const img = document.createElement("img");
    img.src = src;
    img.style.width = "100%";
    img.alt = button.name;
    button.innerText = "";
    button.appendChild(img);
  };

  resetSignatures = () => {
    this.setupSignButtons();
    this.signButtons.forEach((button) => {
      button.classList.add("no-print");
      button.classList.remove("img");
      button.innerText = "Click to sign";
    });
  };

  close = () => {
    let shouldClose = true;
    if (
      !this.signaturePad.isEmpty() &&
      !this.signatureDrawings[this.activeSignatureId]
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

new Signature({
  principalSignature: defaults.principal.signature,
  partnerSignature: defaults.partner.signature,
});
new Inputs({
  principalName: defaults.principal.name,
  partnerName: defaults.partner.name,
  dateEffective: new Date(),
  dateSigned: new Date(),
});
