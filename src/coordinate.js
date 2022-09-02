import Vue from 'vue';

function isHTMLElement(obj) {
  const e = document.createElement('div');

  try {
    e.appendChild(obj.cloneNode(true));
    return obj.nodeType === 1;
  } catch {
    return false;
  }
}

function setObjectStyle(element, styleObject) {
  if (typeof styleObject !== 'object') {
    throw new Error(`${styleObject} must be an object`);
  }

  if (!isHTMLElement(element)) {
    throw new Error(`${element} must be a HTMLElement`);
  }

  for (const [propertyName, value] of Object.entries(styleObject)) {
    element.style.setProperty(propertyName, value);
  }

  return element;
}

function convertNums(num) {
  return Math.floor(num * 100) / 100;
}

const render = new Vue().$createElement;

export default class Coordinate {
  // 源盒子，相当于需要被挂载的载体
  sourceBox = '';
  // 源盒子DOM节点
  sourceEl = '';
  // 生成的容器DOM
  targetBoxEl = '';
  // 当前缩放的比例
  ratio = 0;
  // 是否已经开启
  isStart = false;
  // 源盒子监听
  resizeObserveSourceBox = '';
  // 生成的元素的DOM
  elMap = new Map()

  constructor({ sourceBox } = {}) {
    this.sourceBox = sourceBox;
  }

  setData(data) {
    this.renderData = data;
  }

  /**
   * 开启监听盒子宽高的变化，在挂载后使用
   */
  startListen() {
    this.isStart = true;
    this.sourceEl = document.querySelector(this.sourceBox);
    this.targetBoxEl = document.querySelector('#plv-meet-coordinate-container');
    this.startResizeObserveSourceBox();
  }

  /**
   * @private
   * 开始监听盒子宽高的变化
   */
  startResizeObserveSourceBox() {
    this.resizeObserveSourceBox = new ResizeObserver(this.recalculatePixelSourceBox.bind(this));
    this.resizeObserveSourceBox.observe(document.querySelector(this.sourceBox));
  }

  /**
   * @private
   * 停止监听盒子宽高的变化
   */
  stopResizeObserveSourceBox() {
    this.resizeObserveSourceBox.unobserve(document.querySelector(this.sourceBox));
  }

  /**
   * 取消监听盒子宽高的变化
   */
  stopListen() {
    this.isStart = false;
    this.stopResizeObserveSourceBox();
  }

  /**
   * 重新计算元素的宽高和位置
   */
  recalculatePixelSourceBox() {
    const ratio = this.convertRatio();
    setObjectStyle(this.targetBoxEl, ratio);

    this.renderData.seats.forEach((item) => {
      const el = document.querySelector(`#plv-meet-coordinate-container-${item.id}`);
      const style = {
        width: item.width * this.ratio + 'px',
        height: item.height * this.ratio + 'px',
        transform: `translate3d(${item.x * this.ratio}px, ${item.y * this.ratio}px, 0)`
      };
      setObjectStyle(el, style);
      if (item.identifyInfo) {
        const elIdentify = document.querySelector(`#plv-meet-coordinate-container-${item.id}-identify`);
        const styleIdentify = {
          width: item.identifyInfo.width * this.ratio + 'px',
          height: item.identifyInfo.height * this.ratio + 'px',
          transform: `translate3d(${item.identifyInfo.x * this.ratio}px, ${item.identifyInfo.y * this.ratio}px, 0)`
        };
        setObjectStyle(elIdentify, styleIdentify);
      }
    });
  }

  /**
   * 转换比例，文档详见https://wiki.igeeker.org/pages/viewpage.action?pageId=460013049#id-研讨会自定义布局-比例转换方式
   * @param useQuerySelector 是否采用querySelector，否的话使用缓存的元素
   * @returns {{width: string, height: string}}
   */
  convertRatio(useQuerySelector = false) {
    const targetH = this.renderData.background.height;
    const targetW = this.renderData.background.width;
    const {
      height: sourceH,
      width: sourceW
    } = useQuerySelector ? document.querySelector(this.sourceBox).getBoundingClientRect() : this.sourceEl.getBoundingClientRect();
    let width;
    let height = 0;

    width = sourceW;
    height = convertNums((width * targetH) / targetW);
    if (height <= sourceH) {
      this.ratio = sourceW / targetW;
      return { width: width + 'px', height: height + 'px' };
    }

    height = sourceH;
    width = convertNums((height * targetW) / targetH);
    this.ratio = sourceH / targetH;
    return { width: width + 'px', height: height + 'px' };
  }

  /**
   * 生成vue的VNode
   * @returns {*}
   */
  createVNode() {
    const radio = this.convertRatio(true);
    const child = this.renderData.seats.map((item) => {
      const el = render('div', {
        attrs: {
          id: `plv-meet-coordinate-container-${item.id}`
        },
        style: {
          width: item.width * this.ratio + 'px',
          height: item.height * this.ratio + 'px',
          // 'background-image': `url(${ this.renderData.placeholderImg })`,
          // 'background-size': 'contain',
          background: '#ffc0cb91',
          position: 'absolute',
          top: '0',
          left: '0',
          transform: `translate3d(${item.x * this.ratio}px, ${item.y * this.ratio}px, 0)`,
          ...(item.shape ? {} : { 'border-radius': '50%' })
        }
      });
      this.elMap.set(`plv-meet-coordinate-container-${item.id}`, el);
      return el;
    });

    const identifyChild = this.renderData.seats.map((item) => {
      if (item.identifyInfo) {
        return render('div', {
          attrs: {
            id: `plv-meet-coordinate-container-${item.id}-identify`
          },
          style: {
            width: item.identifyInfo.width * this.ratio + 'px',
            height: item.identifyInfo.height * this.ratio + 'px',
            'background-image': `url(${item.identifyInfo.img})`,
            'background-size': 'contain',
            position: 'absolute',
            top: '0',
            left: '0',
            // display: 'none',
            transform: `translate3d(${item.identifyInfo.x * this.ratio}px, ${item.identifyInfo.y * this.ratio}px, 0)`,
          }
        });
      }
      return '';
    });

    return render('div', {
      attrs: {
        id: 'plv-meet-coordinate-container'
      },
      style: {
        width: radio.width,
        height: radio.height,
        'background-image': `url(${this.renderData.background.url})`,
        'background-size': 'contain',
        position: 'relative',
      }
    }, [child, identifyChild, this.renderData.background.tableUrl ?
      render(
        'div', {
          style: {
            width: '100%',
            height: '100%',
            'background-image': `url(${this.renderData.background.tableUrl})`,
            'background-size': 'contain',
          }
        }
      ) :
      '']);
  }

  /**
   * 控制容器的隐藏和展示
   * @param id
   * @param value
   * @returns {*|Node|boolean}
   */
  changeContentShow(id, value) {
    if (!this.elMap.has(`plv-meet-coordinate-container-${id}`)) {
      return false;
    }
    const el = this.elMap.get(`plv-meet-coordinate-container-${id}`).elm;
    el.style.setProperty('display', value);
    return el;
  }

  /**
   * 控制标识符额外元素的隐藏和展示
   * @param id
   * @param value
   * @returns {boolean|*|Node}
   */
  changeContentIdentifyShow(id, value) {
    const el = document.querySelector(`#plv-meet-coordinate-container-${id}-identify`);
    if (!el) {
      return false;
    }
    el.style.setProperty('display', value);
    return el;
  }

  destroy() {
    this.elMap.clear();
    this.stopResizeObserveSourceBox();
  }
}
