import "./app.css";
import App from "./App.svelte";
import { mount } from "svelte";

const target = document.getElementById("app");
if (target) {
  target.innerHTML = "";
}

const app = mount(App, {
  target
});

export default app;

