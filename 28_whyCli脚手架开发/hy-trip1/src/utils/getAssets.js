export const getAssetURL = (image) => {
	// 第一个参数: 相对路径
	// 第二个参数: 当地路径的URL
	const url = new URL(`../assets/img/${image}`, import.meta.url).href;
	return url;
}