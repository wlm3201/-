let getel = document.getElementById
let newel = document.createElement
getel = getel.bind(document)
newel = newel.bind(document)
let docel = document.documentElement
let format = (num) => (num > 10000 ? Math.floor(num / 10000) + '万' : num)
let api = (path, params) => axios.get(path, { params: params })
let api2 = (path, data) => axios.post(path, data)
let uid = Number(localStorage.getItem('uid'))
let container = getel('container')

let div = newel('div')
let str = ''

let userid = getel('userid')
userid.innerText = uid

let login = getel('login')
login.onclick = async () => {
  let phone = getel('phone')
  let password = getel('password')
  let r = await api('/login/cellphone', {
    phone: phone.value,
    password: password.value,
  })
  if (r.status !== 200) {
    stat.innerText = '登录失败'
    return
  }
  r = await api('login/status')
  uid = r.data.data.profile.userId
  localStorage.setItem('uid', uid)
  stat.innerText = '登录成功'
  phone.value = ''
  password.value = ''
  loadlist()
}
let stat = getel('stat')
let savelist = getel('savelist')
savelist.onclick = async () => {
  let ids = [...container.children, ...leftctn.children].flatMap((el) =>
    el.classList.contains('fd') ? [...el.ids] : el.pl.id,
  )
  let r = await api2('/playlist/order/update', { ids: JSON.stringify(ids) })
  let fds = [...document.getElementsByClassName('fd')].map((fd) => {
    return {
      name: fd.name,
      ids: [...fd.ids],
    }
  })
  localStorage.setItem('fds', JSON.stringify(fds))
  stat.innerText = '更改成功'
}

let loadlist = async (e) => {
  let r
  if (new URL(location.href).port === '5500') {
    r = await api('/user/playlist.json')
  } else if (e?.isTrusted) {
    r = await api('/user/playlist', { uid: uid, timestamp: Date.now() })
  } else r = await api('/user/playlist', { uid: uid })
  let pls = r.data.playlist
  getel('plc').innerText = pls.length
  container.replaceChildren()
  for (let pl of pls) {
    if (pl.userId === uid) continue
    let wrap = newel('div')
    wrap.className = 'pl'
    wrap.pl = pl
    wrap.id = pl.id

    let cover = new Image()
    cover.loading = 'lazy'
    cover.className = 'cover'
    cover.src = pl.coverImgUrl.split('?')[0] + '?param=140y140'
    if (pl.highQuality) cover.classList.add('hq')
    if (pl.updateFrequency) cover.classList.add('uf')
    wrap.append(cover)

    let name = newel('span')
    name.className = 'name'
    name.innerText = pl.name
    wrap.append(name)

    let tc = newel('span')
    tc.className = 'tc'
    tc.innerText = pl.trackCount + '首'
    wrap.append(tc)

    let pc = newel('span')
    pc.className = 'pc'
    pc.innerText = `${format(pl.playCount)}\n${format(pl.subscribedCount)}`
    wrap.append(pc)

    container.append(wrap)
  }
  let fds = JSON.parse(localStorage.getItem('fds'))
  if (fds) {
    fds.reverse()
    for (finfo of fds) {
      let fd = newfolder.onclick(finfo.name)
      let fpls = fd.fpls
      finfo.ids.forEach((id) => {
        let el = getel(id)
        if (el) fpls.append(el)
      })
      container.prepend(fd)
    }
    document.querySelectorAll(':focus').forEach((el) => el.blur())
  }
  stat.innerText = '加载成功'
}

document.ondragenter = (e) => e.preventDefault()
document.ondragover = (e) => {
  e.preventDefault()
  let target = e.target.closest('.pl,.fd')
  let hold = holded[0]
  if (!target || !hold || holded.length > 1) return
  if (rightctn.contains(target) && !hold.classList.contains('pl')) return
  if (hold.classList.contains('pl') && target.classList.contains('fd')) return
  if (target.nextElementSibling === hold) target.before(hold)
  else if (target.previousElementSibling === hold) target.after(hold)
  else target.before(hold)
}
document.ondrop = (e) => {
  let target = e.target
  let fd = target.closest('.fd')
  let pls = holded.filter((el) => el.classList.contains('pl'))
  if (fd) fd.fpls.append(...pls)
  else {
    let pl = target.closest('.pl')
    if (pl) {
      if (rightctn.contains(pl)) pls.forEach((el) => pl.before(el))
      else holded.forEach((el) => pl.before(el))
    } else {
      let ctn = target.closest('#container,.sidectn')
      if (!ctn) return
      if (ctn === rightctn) ctn.append(...pls)
      else ctn.append(...holded)
    }
  }
  holded.forEach((el) => el.classList.remove('selected'))
}
let holded = []
let dragimg = getel('dragimg')

document.ondragstart = (e) => {
  getSelection().collapse(null)
  let target = e.target.closest?.('.pl,.fd')
  if (!target) e.preventDefault()
  let selected = [...document.querySelectorAll('.selected')]
  if (selected.includes(target)) {
    dragimg.innerText = selected.length
    e.dataTransfer.setDragImage(dragimg, 0, 0)
    holded = selected
  } else {
    selected.forEach((el) => el.classList.remove('selected'))
    if (target) {
      e.dataTransfer.setDragImage(target, 0, 0)
      holded = [target]
      target.classList.add('selected')
    } else holded = []
  }
  e.dataTransfer.effectAllowed = 'link'
}

let leftbar = getel('leftbar')
let leftctn = getel('leftctn')
let rightctn = getel('rightctn')
let rightbar = getel('rightbar')
let rightbtn = getel('rightbtn')
let leftbtn = getel('leftbtn')
leftbtn.onclick = () => leftbar.classList.add('hide')

rightbtn.onclick = () => rightbar.classList.add('hide')

let newfolder = getel('newfolder')
newfolder.onclick = (fname) => {
  leftbar.classList.remove('hide')

  let fd = newel('div')
  fd.ids = new Set()
  fd.className = 'fd'

  let cover = newel('div')
  cover.className = 'fcover'
  cover.draggable = true
  fd.append(cover)

  let name = newel('div')
  name.className = 'name'
  name.innerText = typeof fname === 'string' ? fname : '新建文件夹'
  fd.append(name)

  let fpls = newel('div')
  fd.fpls = fpls

  let fplsname = newel('div')
  fplsname.className = 'fplsname'
  fpls.append(fplsname)

  name.ondblclick = () => {
    let input = newel('textarea')
    input.className = 'rename'
    input.value = name.innerText
    input.onblur = () => {
      name.innerText = input.value
      fplsname.innerText = name.innerText
      fd.name = name.innerText
      input.replaceWith(name)
    }
    input.onkeydown = (e) => {
      if (e.key === 'Enter') input.blur()
    }
    input.oninput = () => {
      input.style.height = '1em'
      input.style.height = input.scrollHeight + 'px'
    }
    name.replaceWith(input)
    input.oninput()
    input.focus()
    input.select()
  }
  leftctn.prepend(fd)
  name.ondblclick()
  fpls.className = 'sidectn'
  fpls.id = 'rightctn'
  fd.onclick = (e) => {
    if (e.target.classList.contains('name')||e.target.classList.contains('rename')) return
    rightbar.classList.remove('hide')
    rightctn.replaceWith(fpls)
    rightctn = fpls
  }
  fd.oncontextmenu = (e) => {
    menu.replaceChildren()
    let item = newel('div')
    item.className = 'item'
    item.innerText = '删除'
    menu.append(item)
    item.onclick = () => {
      let selected = [...document.querySelectorAll('.selected')]
      if (selected.includes(fd))
        selected.forEach((el) => {
          if (el.classList.contains('fd')) {
            container.append(...el.fpls.querySelectorAll('.pl'))
            el.remove()
          }
        })
      else container.append(...fd.fpls.querySelectorAll('.pl'))
      fd.remove()
      menu.blur()
      let div = newel('div')
      rightctn.replaceWith(div)
      rightctn = div
    }
    menu.show(e)
  }
  let obs = new MutationObserver((mlist, obs) => {
    mlist.forEach((m) => {
      if (m.type === 'childList') {
        m.addedNodes.forEach((pl) => {
          let subcover = pl.querySelector('.cover').cloneNode()
          subcover.className = 'subcover'
          pl.subcover = subcover
          cover.append(subcover)
          fd.ids.add(pl.pl.id)
        })
        m.removedNodes.forEach((pl) => {
          fd.ids.delete(pl.pl.id)
          pl.subcover?.remove()
        })
      }
    })
  })
  obs.observe(fpls, { childList: true })
  return fd
}
document.onkeydown = (e) => {
  if (e.key === 'q' || e.key === 'Q') leftbar.classList.toggle('hide')

  if (e.key === 'e' || e.key === 'E') rightbar.classList.toggle('hide')
}

let menu = getel('menu')
menu.onblur = () => menu.classList.add('hide')
menu.show = (e) => {
  e.preventDefault()
  menu.style.right = ''
  menu.style.bottom = ''
  menu.style.top = e.clientY + 'px'
  menu.style.left = e.clientX + 'px'
  menu.classList.remove('hide')
  menu.focus()
  let rect = menu.getBoundingClientRect()
  if (rect.right > docel.clientWidth) {
    menu.style.left = ''
    menu.style.right = 0
  }
  if (rect.bottom > docel.clientHeight) {
    menu.style.top = ''
    menu.style.bottom = 0
  }
}

document.addEventListener('contextmenu', (e) => {
  let pl = e.target.closest('.pl')
  if (!pl) return
  let selected = [...document.querySelectorAll('.selected')]
  if (!selected.includes(pl)) {
    selected.forEach((el) => el.classList.remove('selected'))
    pl.classList.add('selected')
  }
  menu.replaceChildren()
  document.querySelectorAll('.fd').forEach((fd) => {
    let item = newel('div')
    item.className = 'item'
    item.innerText = fd.name
    menu.append(item)
    item.onclick = () => {
      fd.fpls.append(pl)
      fd.fpls.append(...selected.filter((el) => el.classList.contains('pl')))
      menu.blur()
    }
  })
  menu.show(e)
})
let leftresize = getel('leftresize')
let rightresize = getel('rightresize')
let resizing
document.onauxclick = (e) => {
  if (e.button !== 1) return
  let target = e.target.closest('.pl')
  if (target) {
    window.open(
      'https://music.163.com/#/playlist?id=' + target.id,
      '_blank',
      'noopener',
    )
  }
}
document.addEventListener('click', (e) => {
  let target = e.target.closest('.pl')
  if (!target) return
  if (target.classList.contains('pl')) {
    if (!target.classList.contains('selected') && !e.ctrlKey)
      document
        .querySelectorAll('.selected')
        .forEach((el) => el.classList.remove('selected'))
    target.classList.add('selected')
  }
})
document.onmousemove = (e) => {
  if (resizing === leftresize) {
    e.preventDefault()
    leftbar.style.width = e.pageX + 'px'
  } else if (resizing === rightresize) {
    e.preventDefault()
    rightbar.style.width = docel.clientWidth - e.pageX + 'px'
  }
  if (selecting && getSelection().isCollapsed) {
    e.preventDefault()
    selector.style.left = Math.min(selector.clientX, e.clientX) + 'px'
    selector.style.top = Math.min(selector.clientY, e.clientY) + 'px'
    selector.style.width = Math.abs(selector.clientX - e.clientX) + 'px'
    selector.style.height = Math.abs(selector.clientY - e.clientY) + 'px'
    let rect = selector.getBoundingClientRect()
    if (!e.ctrlKey)
      [leftctn, rightctn, container].forEach((el) =>
        el !== selector.target
          ? el
              .querySelectorAll('.selected')
              .forEach((el) => el.classList.remove('selected'))
          : null,
      )
    selector.target.querySelectorAll('.pl,.fd').forEach((el) => {
      let elrect = el.getBoundingClientRect()
      if (
        elrect.top > rect.bottom ||
        elrect.bottom < rect.top ||
        elrect.left > rect.right ||
        elrect.right < rect.left
      ) {
        if (!e.ctrlKey) el.classList.remove('selected')
      } else el.classList.add('selected')
    })
  }
}
document.onmouseup = () => {
  document.body.style.cursor = ''
  resizing = false
  if (selecting) {
    selecting = false
    selector.classList.add('hide')
  }
}
let selector = getel('selector')
let selecting
document.onmousedown = (e) => {
  let target = e.target
  if (target === leftresize || target === rightresize) {
    document.body.style.cursor = 'e-resize'
    resizing = target
  }
  if (e.ctrlKey || (!e.altKey && target.draggable === false)) {
    selector.target = target.closest('#container,.sidectn')
    if (!selector.target) return
    selecting = true
    getSelection().collapse(null)
    selector.classList.remove('hide')
    selector.clientX = e.clientX
    selector.clientY = e.clientY
    selector.style = ''
  }
}

if (uid) loadlist()
