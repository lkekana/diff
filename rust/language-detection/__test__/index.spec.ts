import test from "ava";
import { detectLanguage, readTextFile } from "../index";

// test("sync function from native code", (t) => {
// 	const fixture = 42;
// 	t.is(plus100(fixture), fixture + 100);
// });


test("detect language", (t) => {
	const fixture = "./package.json";
	t.is(detectLanguage(fixture), "json");
});

test("read text file", (t) => {
	const fixture = "./build.rs";
	t.is(readTextFile(fixture), `fn main() {\n  napi_build::setup();\n}\n`);
});