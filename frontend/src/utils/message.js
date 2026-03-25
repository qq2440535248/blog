import { ElMessage } from "element-plus";

const defaultOptions = {
  placement: "top",
  offset: 84,
  duration: 2200,
  showClose: true,
  grouping: true,
};

function open(type, message, options = {}) {
  return ElMessage({
    ...defaultOptions,
    type,
    message,
    ...options,
  });
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
