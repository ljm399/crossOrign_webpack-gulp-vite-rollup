<template>
  <div class="facility">
    <DetailSection header="房屋设施" more="查看全部设施">
      <template v-for="(item,index) in houseFacility.houseFacilitys" :key="index">  
          <div class="content" v-if="houseFacility.facilitySort.includes(index)">
            <div class="left">
              <img :src="item.icon" alt="">
              <span class="groupName">{{ item.groupName }}</span>
            </div>
            <div class="right">
              <template v-for="(item2, index) in item.facilitys.slice(0,4)">
                <div class="item">
                  <span class="icon icon_check"></span>
                  <span class="name">{{ item2.name }}</span>
                </div>
              </template>
            </div>
          </div>
      </template>
    </DetailSection>
  </div>
</template>

<script setup>
import detailSection from '@/components/detail-section/detail-section.vue';
const props = defineProps({
  houseFacility: {
    type: Object,
    default: () => {}
  }
})
</script>


<style scoped lang="less">
  .facility {
   .content {
      display: flex;
      background-color: rgba(118, 222, 253, 0.1);
      .left {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: 22%;
        padding: 16px;
        gap: 7px;
        img {
          width: 25px;
          height: 25px;
        }
      }
      .right {
        flex: 1;
        display: flex;
        flex-wrap: wrap;
        align-content: center;
        gap: 7px;
        .item {
          display: flex;
          align-items: center;
          width: 48%;
        }
      }
   } 
  }

</style>