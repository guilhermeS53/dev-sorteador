const buttonClassify = document.querySelector(".btn");
const result = document.querySelector(".result");

function generateNumber() {
  const min = Math.ceil(document.querySelector(".input-min").value);
  const max = Math.floor(document.querySelector(".input-max").value);

  const result = Math.floor(Math.random() * (max - min + 1)) + min;

  document.querySelector(".result").value = result;
}

buttonClassify.addEventListener("click", generateNumber);
