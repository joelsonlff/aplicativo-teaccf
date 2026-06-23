// Static map of symbol ID → bundled PNG asset.
// Metro requires literal string paths — cannot be built dynamically.
// nav-* symbols are available for navigation UI use outside the CAA board.
const SYMBOL_IMAGES: Record<string, number> = {
  // PESSOAS
  eu:           require('../../assets/images/symbols/eu.png'),
  voce:         require('../../assets/images/symbols/voce.png'),
  nos:          require('../../assets/images/symbols/nos.png'),
  pai:          require('../../assets/images/symbols/pai.png'),
  mae:          require('../../assets/images/symbols/mae.png'),
  pessoas:      require('../../assets/images/symbols/pessoas.png'),

  // CONFIRMAÇÃO / NEGAÇÃO
  sim:          require('../../assets/images/symbols/sim.png'),
  nao:          require('../../assets/images/symbols/nao.png'),
  'nao-quero':  require('../../assets/images/symbols/nao-quero.png'),
  'nao-pode':   require('../../assets/images/symbols/nao-pode.png'),

  // VERBOS
  quero:        require('../../assets/images/symbols/quero.png'),
  pegar:        require('../../assets/images/symbols/pegar.png'),
  pode:         require('../../assets/images/symbols/pode.png'),
  acabou:       require('../../assets/images/symbols/acabou.png'),
  olha:         require('../../assets/images/symbols/olha.png'),
  ir:           require('../../assets/images/symbols/ir.png'),
  comer:        require('../../assets/images/symbols/comer.png'),
  ajuda:        require('../../assets/images/symbols/ajuda.png'),
  sair:         require('../../assets/images/symbols/sair.png'),
  beber:        require('../../assets/images/symbols/beber.png'),
  abrir:        require('../../assets/images/symbols/abrir.png'),
  fechar:       require('../../assets/images/symbols/fechar.png'),
  brincar:      require('../../assets/images/symbols/brincar.png'),

  // EMOÇÕES
  feliz:        require('../../assets/images/symbols/feliz.png'),
  triste:       require('../../assets/images/symbols/triste.png'),
  bravo:        require('../../assets/images/symbols/bravo.png'),
  assustado:    require('../../assets/images/symbols/assustado.png'),
  calmo:        require('../../assets/images/symbols/calmo.png'),
  cansado:      require('../../assets/images/symbols/cansado.png'),
  'com-dor':    require('../../assets/images/symbols/com-dor.png'),
  surpreso:     require('../../assets/images/symbols/surpreso.png'),
  animado:      require('../../assets/images/symbols/animado.png'),
  nervoso:      require('../../assets/images/symbols/nervoso.png'),
  'com-medo':   require('../../assets/images/symbols/com-medo.png'),
  orgulhoso:    require('../../assets/images/symbols/orgulhoso.png'),

  // COMIDA
  agua:         require('../../assets/images/symbols/agua.png'),
  lanche:       require('../../assets/images/symbols/lanche.png'),
  fruta:        require('../../assets/images/symbols/fruta.png'),
  biscoito:     require('../../assets/images/symbols/biscoito.png'),
  suco:         require('../../assets/images/symbols/suco.png'),
  arroz:        require('../../assets/images/symbols/arroz.png'),
  feijao:       require('../../assets/images/symbols/feijao.png'),
  pao:          require('../../assets/images/symbols/pao.png'),
  leite:        require('../../assets/images/symbols/leite.png'),
  sorvete:      require('../../assets/images/symbols/sorvete.png'),
  iogurte:      require('../../assets/images/symbols/iogurte.png'),
  bolo:         require('../../assets/images/symbols/bolo.png'),

  // BRINQUEDOS
  bola:         require('../../assets/images/symbols/bola.png'),
  boneca:       require('../../assets/images/symbols/boneca.png'),
  'quebra-cab': require('../../assets/images/symbols/quebra-cab.png'),
  massinha:     require('../../assets/images/symbols/massinha.png'),
  tablet:       require('../../assets/images/symbols/tablet.png'),
  livro:        require('../../assets/images/symbols/livro.png'),
  carrinho:     require('../../assets/images/symbols/carrinho.png'),
  pintar:       require('../../assets/images/symbols/pintar.png'),

  // BANHEIRO
  xixi:         require('../../assets/images/symbols/xixi.png'),
  coco:         require('../../assets/images/symbols/coco.png'),
  'lavar-maos': require('../../assets/images/symbols/lavar-maos.png'),
  'papel-hig':  require('../../assets/images/symbols/papel-hig.png'),

  // LUGARES
  'sala-aula':  require('../../assets/images/symbols/sala-aula.png'),
  parque:       require('../../assets/images/symbols/parque.png'),
  refeitorio:   require('../../assets/images/symbols/refeitorio.png'),
  biblioteca:   require('../../assets/images/symbols/biblioteca.png'),
  casa:         require('../../assets/images/symbols/casa.png'),
  carro:        require('../../assets/images/symbols/carro.png'),
  'banheiro-pl':require('../../assets/images/symbols/banheiro-pl.png'),
  quadra:       require('../../assets/images/symbols/quadra.png'),

  // ROTINA
  banho:        require('../../assets/images/symbols/banho.png'),
  escovar:      require('../../assets/images/symbols/escovar.png'),
  cafe:         require('../../assets/images/symbols/cafe.png'),
  'escola-rot': require('../../assets/images/symbols/escola-rot.png'),
  almoco:       require('../../assets/images/symbols/almoco.png'),
  dormir:       require('../../assets/images/symbols/dormir.png'),
  jantar:       require('../../assets/images/symbols/jantar.png'),

  // INTERFACE / NAVEGAÇÃO (para uso em componentes de UI)
  'nav-inicio':    require('../../assets/images/symbols/nav-inicio.png'),
  'nav-menu':      require('../../assets/images/symbols/nav-menu.png'),
  'nav-voltar':    require('../../assets/images/symbols/nav-voltar.png'),
  'nav-avancar':   require('../../assets/images/symbols/nav-avancar.png'),
  'nav-buscar':    require('../../assets/images/symbols/nav-buscar.png'),
  'nav-favoritos': require('../../assets/images/symbols/nav-favoritos.png'),
  'nav-config':    require('../../assets/images/symbols/nav-config.png'),
  'nav-ajuda':     require('../../assets/images/symbols/nav-ajuda.png'),
  'nav-excluir':   require('../../assets/images/symbols/nav-excluir.png'),
  'nav-som':       require('../../assets/images/symbols/nav-som.png'),
  'nav-info':      require('../../assets/images/symbols/nav-info.png'),
  'nav-sair':      require('../../assets/images/symbols/nav-sair.png'),
}

export default SYMBOL_IMAGES
