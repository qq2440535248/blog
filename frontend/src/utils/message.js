import { ElMessage, ElNotification } from "element-plus";
import "element-plus/es/components/message/style/css";
import "element-plus/es/components/notification/style/css";

const defaultOptions = {
    offset: 84,
    duration: 2200,
    showClose: true,
    grouping: false,
    zIndex: 6000,
};

function open(type, text, options = {}) {
    const finalText = String(text ?? "").trim() || "操作成功";

    try {
        return ElMessage({
            ...defaultOptions,
            type,
            message: finalText,
            ...options,
        });
    } catch (_err) {
        return ElNotification({
            type,
            title: type === "error" ? "错误" : "提示",
            message: finalText,
            duration: options?.duration ?? defaultOptions.duration,
            position: "top-right",
        });
    }
}

export default {
    success(message, options) {
        return open("success", message, options);
    },
    error(message, options) {
        return open("error", message, options);
    },
    warning(message, options) {
        return open("warning", message, options);
    },
    info(message, options) {
        return open("info", message, options);
    },
};
