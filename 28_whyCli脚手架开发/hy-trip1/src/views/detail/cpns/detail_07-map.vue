<template>
  <div class="detail-map">
    <DetailSection header="位置信息" more="查看更多周边信息">
      <div id="container">
      </div>
    </DetailSection>
  </div>
</template>

<script setup>
import {onMounted} from 'vue'
const props = defineProps({
  position: {
    type: Object,
    default: () => ({})
  }
})

//点标记显示内容
const markerContent = `<div class="custom-content-marker">
  <img id="marker-img" src="https://pic.tujia.com/upload/customeravatar/day_220106/thumb/202201061735302243_150_150.jpg" alt="">
</div>`

onMounted(() => {
  const map = new AMap.Map("container", {
    mapStyle: "amap://styles/normal",
    viewMode: '2D', //默认使用 2D 模式
    zoom: 15, //地图级别
    center: [props.position.longitude, props.position.latitude], //地图中心点
  });
  const traffic = new AMap.TileLayer.Traffic({
    autoRefresh: true, //是否自动刷新，默认为false
    interval: 180, //刷新间隔，默认180s
  });
  map.add(traffic); //通过add方法添加图层

  //点标记
  const marker = new AMap.Marker({
    position: [props.position.longitude, props.position.latitude], //点标记位置
    content: markerContent, //点标记显示内容
    offset: new AMap.Pixel(-20, -62), //点标记偏移量
    anchor: 'center', //点标记锚点
  });
  map.add(marker); //通过add方法添加点标记
})
</script>


<style scoped lang="less">
#container {
  width: 100%;
  height: 300px;
} 
:deep(.custom-content-marker) {
  position: relative;
  width: 80px;
  height: 80px;
}

:deep(.custom-content-marker) #marker-img {
  width: 100%;
  height: 100%;
}

</style>