<template>
  <div id="app">
    <room v-if="!loading"/>
  </div>
</template>

<script>
import Coordinate from './coordinate';
import Vue from 'vue';
import axios from 'axios';
const coordinate = new Coordinate({
  sourceBox: '#app'
})

window.coordinate = coordinate;
export default {
  name: 'App',
  data() {
    return {
      loading: true,
      layoutData: '',
    }
  },
  mounted() {
    this.getLayoutData();
  },
  methods: {
    async getLayoutData() {
      const data = await axios.get(`https://liveimages.videocc.net/uploaded/files/json/seminar/layout/${this.$route.query.id}.json`);
      this.layoutData = data.data;
      coordinate.setData(this.layoutData);
      this.createRoom();
    },
    createRoom() {
      Vue.component('room', {
        render() {
          return coordinate.createVNode()
        }
      })
      setTimeout(async () => {
        this.loading = false;
        await this.$nextTick();
        coordinate.startListen()
        // this.genItem();
      }, 1)
    },

    genItem() {
      for (let i = 0; i < this.layoutData.seats.length; i++) {
        const el = new (Vue.extend(Item))({}).$mount();
        document.querySelector(`#plv-meet-coordinate-container-${ this.layoutData.seats[i].id }`).appendChild(el.$el)
      }
    },
  }
}
</script>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
}
#app {
  width: 100vw;
  height: 100vh;
}
</style>
