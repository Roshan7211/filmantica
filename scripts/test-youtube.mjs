import { youtubeId, youtubeEmbedUrl, youtubeThumb } from "../src/lib/youtube.ts";
const r=[]; const c=(n,x,d="")=>{r.push(!!x);console.log(`${x?"PASS":"FAIL"}  ${n}${d?"  "+d:""}`)};

c("watch?v=", youtubeId("https://www.youtube.com/watch?v=rt-2cxAiPJk") === "rt-2cxAiPJk");
c("watch with extra params", youtubeId("https://www.youtube.com/watch?v=NhI2UpkFAFw&t=30s") === "NhI2UpkFAFw");
c("param not first", youtubeId("https://youtube.com/watch?list=X&v=0G5CjgPw1x4") === "0G5CjgPw1x4");
c("youtu.be short", youtubeId("https://youtu.be/ZSdOwt-G49w") === "ZSdOwt-G49w");
c("embed url", youtubeId("https://www.youtube.com/embed/MLxgaz2Zp1k") === "MLxgaz2Zp1k");
c("shorts", youtubeId("https://youtube.com/shorts/MLxgaz2Zp1k") === "MLxgaz2Zp1k");
c("bare id passes through", youtubeId("rt-2cxAiPJk") === "rt-2cxAiPJk");
c("null safe", youtubeId(null) === null);
c("empty safe", youtubeId("") === null);
c("non-youtube url", youtubeId("https://vimeo.com/12345") === null);
c("too-short id rejected", youtubeId("https://www.youtube.com/watch?v=abc") === null);
c("too-long id rejected", youtubeId("https://www.youtube.com/watch?v=rt-2cxAiPJkEXTRA") === null);
c("uses nocookie host", youtubeEmbedUrl("abc12345678").startsWith("https://www.youtube-nocookie.com/"));
c("embed disables related", youtubeEmbedUrl("abc12345678").includes("rel=0"));
c("thumb url shape", youtubeThumb("abc12345678") === "https://i.ytimg.com/vi/abc12345678/hqdefault.jpg");

const f=r.filter(x=>!x).length;
console.log(`\n${r.length-f}/${r.length} passed`);
process.exit(f?1:0);
