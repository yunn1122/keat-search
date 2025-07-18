let apiLoaded = null;

export function loadYouTubeAPI() {
  if (!apiLoaded) {
    apiLoaded = new Promise((resolve, reject) => {
      // 检查API是否已经意外加载
      if (window.YT && window.YT.Player) {
        console.log("YouTube API was already loaded.");
        resolve(window.YT);
        return;
      }

      console.log("Loading YouTube IFrame API...");
      
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";

      // 设置全局回调函数
      window.onYouTubeIframeAPIReady = () => {
        console.log("onYouTubeIframeAPIReady triggered. API is ready.");
        resolve(window.YT);
      };

      // 错误处理
      tag.onerror = (error) => {
        console.error("Failed to load YouTube IFrame API script.", error);
        reject("YouTube API script load error");
      };

      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    });
  }

  return apiLoaded;
}