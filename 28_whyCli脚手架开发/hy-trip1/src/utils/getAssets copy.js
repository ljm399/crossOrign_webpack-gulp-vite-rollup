export const getAssetURL = (image) => {
	// 使用动态导入获取资源 URL
	const modules = import.meta.glob('@/assets/img/**/*', { eager: true, as: 'url' })
	const key = `/src/assets/img/${image}`
	console.log('Available modules:', Object.keys(modules))
	console.log('Looking for key:', key)
	return modules[key]
}