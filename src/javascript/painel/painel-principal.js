// painel-principal.js - Inicialização e funções principais
// lista completa de categorias fornecida pelo usuário
const categorias = [
    {value:'1',text:'Produtos / Ferramentas Agrícolas'},
    {value:'2',text:'Combustível'},
    {value:'3',text:'Roupas / Calçados / Acessórios'},
    {value:'4',text:'Acessórios'},
    {value:'5',text:'Pet Shop'},
    {value:'6',text:'Mat. Construção / Elétrico / Tinta'},
    {value:'7',text:'Mercado e Hortifruti'},
    {value:'8',text:'Farmácias / Manipulação'},
    {value:'9',text:'Roupas Infantil / Juvenil'},
    {value:'185',text:'Roupas Infantil / Juvenil'},
    {value:'10',text:'Carro/Oficina'},
    {value:'11',text:'Gráfica'},
    {value:'12',text:'Advocacia'},
    {value:'13',text:'Hotel e Pousada'},
    {value:'14',text:'Academia / Pilates / Esporte'},
    {value:'15',text:'Ótica'},
    {value:'16',text:'Veterinário'},
    {value:'17',text:'Cama / Mesa / Banho'},
    {value:'18',text:'Tatuagem / Piercing'},
    {value:'19',text:'Salão / Estética'},
    {value:'186',text:'Salão / Estética'},
    {value:'20',text:'Dentista'},
    {value:'21',text:'Imobiliária / Corretora'},
    {value:'22',text:'Produtos Naturais / Suplementos'},
    {value:'23',text:'Borracharia'},
    {value:'24',text:'Presente / Brinquedo / 1,99'},
    {value:'25',text:'Móveis / Eletromóveis'},
    {value:'26',text:'Decoração / Gesso'},
    {value:'27',text:'Bar / Lanchonete / Pizzaria'},
    {value:'28',text:'Compra / Venda'},
    {value:'29',text:'Água e Gás'},
    {value:'30',text:'Floricultura / Decoração'},
    {value:'31',text:'Lava-Jato'},
    {value:'32',text:'Manutenção Celular / Acessórios'},
    {value:'33',text:'Auto Escola'},
    {value:'34',text:'Padaria'},
    {value:'35',text:'Lingerie / Sex Shop'},
    {value:'36',text:'Bebidas / Distribuidora'},
    {value:'37',text:'Gelo'},
    {value:'38',text:'Foto / Filmagem'},
    {value:'39',text:'Açaí / Sorvete'},
    {value:'40',text:'Restaurante'},
    {value:'41',text:'Barbeiro'},
    {value:'42',text:'Artesanato'},
    {value:'43',text:'Produtos Eletrônicos'},
    {value:'44',text:'Vidraçaria / Forro / Divisória'},
    {value:'45',text:'Moto'},
    {value:'46',text:'Internet'},
    {value:'47',text:'Papelaria / Lan House'},
    {value:'48',text:'Manutenção de Computador / Acessórios'},
    {value:'49',text:'Serralheria'},
    {value:'50',text:'Contabilidade'},
    {value:'51',text:'Fisioterapia'},
    {value:'52',text:'Piscinas'},
    {value:'53',text:'Perfumaria / Cosmético'},
    {value:'54',text:'Designer / Publicidade'},
    {value:'55',text:'Joias / Relógios'},
    {value:'56',text:'Aluguel de Roupa'},
    {value:'57',text:'Doces / Sobremesa'},
    {value:'58',text:'Faxineira'},
    {value:'59',text:'Churrasco'},
    {value:'60',text:'Comida Japonesa'},
    {value:'61',text:'Arquitetura'},
    {value:'62',text:'Artigos para festa'},
    {value:'63',text:'Frango Assado'},
    {value:'64',text:'Clínica'},
    {value:'65',text:'Laboratório'},
    {value:'66',text:'Otorrinolaringologista'},
    {value:'67',text:'Ortopedista'},
    {value:'68',text:'Engenharia / Construção'},
    {value:'69',text:'Estofador'},
    {value:'70',text:'Madeira'},
    {value:'71',text:'Móveis Planejados / Marcenaria'},
    {value:'72',text:'Rádio'},
    {value:'73',text:'Carro de Som'},
    {value:'74',text:'Financeiro / Empréstimo'},
    {value:'75',text:'Mármore / Granito'},
    {value:'76',text:'Manutenção de Eletrodomésticos'},
    {value:'77',text:'Taxi'},
    {value:'78',text:'Guincho'},
    {value:'79',text:'Frete'},
    {value:'80',text:'Pedreiro'},
    {value:'81',text:'Garçon'},
    {value:'82',text:'Jardineiro'},
    {value:'83',text:'Antenas / Celular rural'},
    {value:'84',text:'Segurança Eletrônica/TV'},
    {value:'85',text:'Concerto Geral'},
    {value:'86',text:'Nutricionista'},
    {value:'87',text:'Açougue'},
    {value:'88',text:'Disk Cerveja'},
    {value:'89',text:'Embalagens'},
    {value:'90',text:'Telefones Úteis'},
    {value:'91',text:'Variedade'},
    {value:'92',text:'Marmoraria'},
    {value:'93',text:'Bicicleta'},
    {value:'94',text:'Ração'},
    {value:'95',text:'Peixaria'},
    {value:'96',text:'Chaveiro'},
    {value:'97',text:'Selaria'},
    {value:'98',text:'Armarinho / Artesanato'},
    {value:'99',text:'Psicologia'},
    {value:'162',text:'Psicologia'},
    {value:'100',text:'Corretora de Seguros'},
    {value:'101',text:'Músicos / Bandas'},
    {value:'102',text:'Tendas'},
    {value:'103',text:'Instrumentos Musicais'},
    {value:'104',text:'Material de Limpeza'},
    {value:'105',text:'Artigos'},
    {value:'106',text:'Equipamentos Gastronômico'},
    {value:'107',text:'Caça e Pesca'},
    {value:'108',text:'Designer'},
    {value:'109',text:'Acessório / Som / Insulfilm'},
    {value:'110',text:'Caminhões / Pesados'},
    {value:'111',text:'Estética'},
    {value:'112',text:'Dermatologia'},
    {value:'113',text:'Curso / Treinamento'},
    {value:'114',text:'Funerária'},
    {value:'115',text:'Segurança Ocupacional'},
    {value:'116',text:'Nefrologia'},
    {value:'117',text:'Energia Solar'},
    {value:'118',text:'Ginecologista / Obstetrícia'},
    {value:'119',text:'Buffet'},
    {value:'120',text:'Despachante'},
    {value:'121',text:'Conserto em Geral'},
    {value:'122',text:'Transporte'},
    {value:'123',text:'Associações'},
    {value:'124',text:'Pintor'},
    {value:'125',text:'Tel. Úteis'},
    {value:'126',text:'Locação de Veículos'},
    {value:'127',text:'Manicure / Pedicure'},
    {value:'128',text:'Alfaiate'},
    {value:'129',text:'Consultoria Agrícola'},
    {value:'130',text:'Treino / Armas'},
    {value:'131',text:'Torneiro Mecânico'},
    {value:'132',text:'Cerimonial'},
    {value:'133',text:'Marketing'},
    {value:'134',text:'Refrigeração'},
    {value:'135',text:'Corretor de Imóveis / Seguros'},
    {value:'136',text:'Manutenção em Computador'},
    {value:'137',text:'Plano de Saúde'},
    {value:'138',text:'Cafeteria'},
    {value:'139',text:'Eletricista'},
    {value:'140',text:'Máquinas / Equipamentos'},
    {value:'141',text:'Cartório'},
    {value:'142',text:'Teste - Importação'},
    {value:'143',text:'Aluguel de Andaimes / Máquinas'},
    {value:'144',text:'Oftalmologista'},
    {value:'145',text:'Palco / Som'},
    {value:'146',text:'Costureiro'},
    {value:'148',text:'Roupa Fitness / Praia'},
    {value:'182',text:'Roupa Fitness / Praia'},
    {value:'149',text:'Lan House'},
    {value:'150',text:'Línguas'},
    {value:'151',text:'Graduação'},
    {value:'152',text:'Sapateiro'},
    {value:'153',text:'Higienização'},
    {value:'154',text:'Poupa / Suco'},
    {value:'156',text:'Fábrica de Ração'},
    {value:'157',text:'Notícias'},
    {value:'158',text:'Fonoaudiólogo'},
    {value:'159',text:'Cinema'},
    {value:'163',text:'Quiosque'},
    {value:'165',text:'Manutenção de Máquinas'},
    {value:'166',text:'Metalurgia'},
    {value:'167',text:'Dedetização'},
    {value:'168',text:'Pamonha'},
    {value:'169',text:'Shopping Piúma'},
    {value:'170',text:'Placa / Extintor'},
    {value:'171',text:'Construção / Reforma'},
    {value:'172',text:'Topografia / Ambiental'},
    {value:'173',text:'Loja de Computador / Manutenção'},
    {value:'174',text:'Motel'},
    {value:'175',text:'Uniforme / Camisa Personalizada'},
    {value:'176',text:'Aluguel de Stands'},
    {value:'180',text:'Artigos Religiosos'},
    {value:'199',text:'Artigos Religiosos'},
    {value:'187',text:'Agência de Turismo'},
    {value:'188',text:'Aluguel / Venda'},
    {value:'189',text:'Luthier'},
    {value:'190',text:'Comida Fitness'},
    {value:'191',text:'UPLAJ'},
    {value:'192',text:'Hospital'},
    {value:'193',text:'Comida Árabe'},
    {value:'194',text:'Autoatendimento'},
    {value:'195',text:'Tosa e Banho'},
    {value:'196',text:'Residencial / Apartamento / Aluguel'},
    {value:'197',text:'Comida Havaiana'},
    {value:'198',text:'Massa'},
    {value:'200',text:'UBER'}
];

function populateCategorySelects() {
    const selects = document.querySelectorAll('.categoria-select');
    const categoriasOrdenadas = [...categorias].sort((a, b) =>
        a.text.localeCompare(b.text, 'pt-BR', { sensitivity: 'base' })
    );

    selects.forEach(select => {
        // preserve default option
        const defaultOpt = '<option value="">Selecione uma opção</option>';
        select.innerHTML = defaultOpt;
        categoriasOrdenadas.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.value;
            opt.textContent = cat.text;
            select.appendChild(opt);
        });
        // Inicializar estado visual
        updateSelectState(select);
    });
}

// Atualiza o estado visual (empty/filled) do select
function updateSelectState(select) {
    if (select.value === '') {
        select.classList.remove('filled');
        select.classList.add('empty');
    } else {
        select.classList.remove('empty');
        select.classList.add('filled');
    }
}

function handleCategoriaChange(e) {
    const current = e.target;
    const val = current.value;
    
    // Atualizar estado visual do select
    updateSelectState(current);
    
    // update preview tags based on current selects
    updatePreviewSegments();
    
    if (!val) return;
    const selects = Array.from(document.querySelectorAll('.categoria-select'));
    for (const sel of selects) {
        if (sel !== current && sel.value === val) {
            alert('Categoria já selecionada em outro campo. Escolha outra.');
            current.value = '';
            updateSelectState(current);
            updatePreviewSegments();
            return;
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando painel...');

    // Verificar autenticação
    if (typeof Auth !== 'undefined' && !Auth.isAuthenticated()) {
        window.location.href = 'index.html#auth';
        return;
    }

    // preenche selects de categoria antes de carregar perfil
    populateCategorySelects();

    // Carregar perfil
    carregarPerfil();

    // Carregar links
    if (window.LinksManager) {
        LinksManager.carregarLinks();
    }

    // Carregar galeria
    if (window.GaleriaManager) {
        GaleriaManager.carregarGaleria();
        
        // Restaurar modo de visualização salvo após um pequeno delay para garantir que o DOM está pronto
        setTimeout(() => {
            const dropdownViewMode = document.getElementById('galleryViewMode');
            if (dropdownViewMode) {
                const modoSalvo = localStorage.getItem('trilista_gallery_view_mode') || '1';
                dropdownViewMode.value = modoSalvo;
                GaleriaManager.changeViewMode(modoSalvo);
            }
        }, 100);
    }

    // Carregar vídeos
    if (window.VideosManager) {
        VideosManager.carregarVideos();
    }

    // Carregar template (Aparência)
    if (window.TemplateManager) {
        TemplateManager.loadSavedTemplate();
    } else if (window.CustomAppearanceManager) {
        CustomAppearanceManager.init();
    }

    // Injetar botão "Página da Loja" se não existir
    injectStorePageButton();

    // Configurar event listeners
    configurarEventListeners();

    // Atualizar uso de storage
    atualizarStorageDisplay();

    const accountModal = document.getElementById('accountSettingsModal');
    if (accountModal) {
        accountModal.addEventListener('click', function(event) {
            if (event.target === accountModal) {
                closeAccountSettingsModal();
            }
        });
    }

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeAccountSettingsModal();
        }
    });

    if (window.Auth && typeof Auth.completePendingOAuth === 'function') {
        Auth.completePendingOAuth().then((oauthResult) => {
            if (!oauthResult?.handled) return;

            if (!oauthResult.success) {
                if (oauthResult.message) {
                    alert(oauthResult.message);
                }
                return;
            }

            if (oauthResult.message) {
                alert(oauthResult.message);
            }
        }).catch((error) => {
            console.warn('Aviso: nao foi possivel concluir o fluxo Google no painel:', error.message);
        });
    }
});

function injectStorePageButton() {
    const btnGrid = document.getElementById('headerButtons');
    const adminContainer = document.getElementById('adminLinkContainer');
    
    // Injetar botão Admin se for admin
    if (adminContainer && Auth.isAdmin()) {
        adminContainer.innerHTML = `
            <button class="btn-small btn-admin" onclick="window.location.href='admin.html'" style="background: var(--admin-primary, #1e293b); color: white;">
                <i class="fa-solid fa-user-shield"></i> Admin
            </button>
        `;
    }

    if (btnGrid && !document.getElementById('btnOpenStorePage')) {
        const storeBtn = document.createElement('button');
        storeBtn.id = 'btnOpenStorePage';
        storeBtn.className = 'btn-small btn-primary';
        storeBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        storeBtn.innerHTML = '<i class="fa-solid fa-globe"></i> Loja';
        storeBtn.onclick = openStorePage;
        
        // Inserir no início do grid
        btnGrid.insertBefore(storeBtn, btnGrid.firstChild);
    }
}

function togglePreview() {
    const container = document.querySelector('.container');
    const previewSection = document.querySelector('.preview-section');
    const btn = document.getElementById('btnTogglePreview');
    
    if (!container || !previewSection || !btn) return;
    
    // Obter o display atual (considerando o CSS)
    const currentDisplay = window.getComputedStyle(previewSection).display;
    const isHidden = currentDisplay === 'none';
    
    if (isHidden) {
        previewSection.style.display = 'flex';
        btn.innerHTML = '<i class="fa-solid fa-mobile-screen"></i> Ocultar Preview';
        container.classList.remove('preview-hidden');
    } else {
        previewSection.style.display = 'none';
        btn.innerHTML = '<i class="fa-solid fa-eye"></i> Mostrar Preview';
        container.classList.add('preview-hidden');
    }
}

window.togglePreview = togglePreview;

function openStorePage() {
    // Obter a chave do banco de dados do usuário atual
    let storeKey = '';
    if (window.TrilistaDB && typeof TrilistaDB.getCurrentDBKey === 'function') {
        storeKey = TrilistaDB.getCurrentDBKey();
    }
    
            // Abrir a página loja.html passando a chave da loja como parâmetro
            const url = `loja.html${storeKey ? `?store=${storeKey}` : ''}`;
    window.open(url, '_blank');
}

window.openStorePage = openStorePage;

function carregarPerfil() {
    if (window.TrilistaDB) {
        const profile = TrilistaDB.getProfile();
        if (profile) {
            if (profile.storeName) {
                const storeNameInput = document.getElementById('store_name');
                const previewStoreName = document.getElementById('previewStoreName');
                if (storeNameInput) storeNameInput.value = profile.storeName;
                if (previewStoreName) previewStoreName.textContent = profile.storeName;
            }

            // Carregar Bio no Editor ContentEditable
            const bioEditor = document.getElementById('store_bio');
            if (bioEditor) {
                bioEditor.innerHTML = profile.bio || '';
                handleEditorInput(bioEditor); // Atualizar contador e preview
            }

            if (profile.profilePhoto) {
                const storeAvatar = document.querySelector('.store-avatar');
                if (storeAvatar) {
                    storeAvatar.innerHTML = '<img src="' + profile.profilePhoto + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">';
                }
                // Add remove button to upload box
                const uploadBox = document.querySelector('.upload-area .upload-box:first-child');
                if (uploadBox && !uploadBox.querySelector('.remove-btn')) {
                    uploadBox.classList.add('has-file');
                    const removeBtn = document.createElement('button');
                    removeBtn.className = 'remove-btn';
                    removeBtn.title = 'Remover foto';
                    removeBtn.innerHTML = '<i class="fa-solid fa-xmark fa-xs"></i>';
                    removeBtn.onclick = function(e) {
                        e.stopPropagation();
                        removeProfilePhoto();
                    };
                    uploadBox.appendChild(removeBtn);
                }
            }
            if (profile.coverPhoto) {
                const cover = document.getElementById('storeCover');
                if (cover) {
                    cover.style.backgroundImage = 'url(' + profile.coverPhoto + ')';
                    cover.classList.add('has-cover');
                }
                // Add remove button to upload box
                const uploadBox = document.querySelector('.upload-area .upload-box:nth-child(2)');
                if (uploadBox && !uploadBox.querySelector('.remove-btn')) {
                    uploadBox.classList.add('has-file');
                    const removeBtn = document.createElement('button');
                    removeBtn.className = 'remove-btn';
                    removeBtn.title = 'Remover capa';
                    removeBtn.innerHTML = '<i class="fa-solid fa-xmark fa-xs"></i>';
                    removeBtn.onclick = function(e) {
                        e.stopPropagation();
                        removeCoverPhoto();
                    };
                    uploadBox.appendChild(removeBtn);
                }
            }
            if (profile.address) {
                // Suporta endereços antigos ("Rua X, 123") e novos (rua + número separados)
                const parts = profile.address.split(',');
                const street = parts[0]?.trim() || '';
                let numberPart = parts[1]?.trim() || '';

                // Remove prefix "Nº" / "N.º" / "No" / "nº" caso exista
                numberPart = numberPart.replace(/^\s*(n\.?\s*º\s*|n\.?\s*o\s*|no\s+)/i, '').trim();

                document.getElementById('store_address').value = street;
                const numberInput = document.getElementById('store_number');
                const numberSn = document.getElementById('store_number_sn');
                if (numberInput) {
                    if (numberPart.toLowerCase() === 's/n') {
                        numberInput.value = '';
                        if (numberSn) numberSn.checked = true;
                        numberInput.disabled = true;
                    } else {
                        numberInput.value = numberPart;
                        if (numberSn) numberSn.checked = false;
                        numberInput.disabled = false;
                    }
                }
            }
            if (profile.neighborhood) {
                document.getElementById('store_neighborhood').value = profile.neighborhood;
            }
            if (profile.city) {
                document.getElementById('store_city').value = profile.city;
            }
            const showViewCounterInput = document.getElementById('show_view_counter');
            if (showViewCounterInput) {
                showViewCounterInput.checked = (
                    profile.showViewCounter === true ||
                    profile.showViewCounter === 'true' ||
                    profile.showViewCounter === 1 ||
                    profile.showViewCounter === '1'
                );
            }

            updatePreviewViewCounter(profile);
            
            // restore saved segmento/categorias
            ['categoria1','categoria2','categoria3','categoria4'].forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.value = profile[id] || '';
                    updateSelectState(el);
                }
            });
            
            // Update preview segments and location
            updatePreviewSegments(profile);
            updatePreviewLocation(profile);
            
            // Update panel title
            updatePanelTitle(profile);
        } else {
            // If no profile saved, update title with default
            updatePanelTitle({ storeName: 'Minha Loja Incrível' });
        }
    }
}

function buildAddressValue() {
    const storeAddressInput = document.getElementById('store_address');
    const storeNumberInput = document.getElementById('store_number');
    const storeNumberSN = document.getElementById('store_number_sn');

    const street = storeAddressInput?.value.trim() || '';
    const number = storeNumberInput?.value.trim() || '';
    const hasSn = storeNumberSN?.checked;

    if (!street) return '';
    if (hasSn) return `${street}, s/n`;
    if (number) return `${street}, Nº ${number}`;
    return street;
}

function configurarEventListeners() {
    const storeNameInput = document.getElementById('store_name');
    const storeBioInput = document.getElementById('store_bio');
    const previewStoreName = document.getElementById('previewStoreName');

    if (storeNameInput && previewStoreName) {
        storeNameInput.addEventListener('input', function() {
            previewStoreName.textContent = this.value || 'Minha Loja Incrível';
        });
    }

    if (storeBioInput) {
        storeBioInput.addEventListener('input', function() {
            handleEditorInput(this);
        });

        storeBioInput.addEventListener('blur', function() {
            handleEditorInput(this);
        });

        handleEditorInput(storeBioInput);
    }

    // Event listeners for location fields
    const storeAddressInput = document.getElementById('store_address');
    const storeNumberInput = document.getElementById('store_number');
    const storeNumberSN = document.getElementById('store_number_sn');
    const storeNeighborhoodInput = document.getElementById('store_neighborhood');
    const storeCityInput = document.getElementById('store_city');

    function updateLocationPreview() {
        const address = buildAddressValue();
        const neighborhood = storeNeighborhoodInput?.value || '';
        const city = storeCityInput?.value || '';
        
        updatePreviewLocation({ address, neighborhood, city });
    }

    if (storeAddressInput) {
        storeAddressInput.addEventListener('input', updateLocationPreview);
    }
    if (storeNumberInput) {
        storeNumberInput.addEventListener('input', () => {
            if (storeNumberSN && storeNumberSN.checked) return;
            updateLocationPreview();
        });
    }
    if (storeNumberSN) {
        storeNumberSN.addEventListener('change', () => {
            if (storeNumberSN.checked) {
                storeNumberInput.value = '';
                storeNumberInput.disabled = true;
            } else {
                storeNumberInput.disabled = false;
                storeNumberInput.focus();
            }
            updateLocationPreview();
        });
    }
    if (storeNeighborhoodInput) {
        storeNeighborhoodInput.addEventListener('input', updateLocationPreview);
    }
    if (storeCityInput) {
        storeCityInput.addEventListener('input', updateLocationPreview);
    }

    const showViewCounterInput = document.getElementById('show_view_counter');
    if (showViewCounterInput) {
        showViewCounterInput.addEventListener('change', function() {
            updatePreviewViewCounter({ showViewCounter: this.checked });
        });
    }

    const profilePhoto = document.getElementById('profile_photo');
    if (profilePhoto) {
        profilePhoto.addEventListener('change', function(e) {
            if (e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const storeAvatar = document.querySelector('.store-avatar');
                    if (storeAvatar) {
                        storeAvatar.innerHTML = `<img src="${event.target.result}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
                    }
                    if (window.TrilistaDB) {
                        TrilistaDB.saveProfile({ profilePhoto: event.target.result });
                    }
                    // Add remove button to upload box
                    const uploadBox = document.querySelector('.upload-area .upload-box:first-child');
                    if (uploadBox && !uploadBox.querySelector('.remove-btn')) {
                        uploadBox.classList.add('has-file');
                        const removeBtn = document.createElement('button');
                        removeBtn.className = 'remove-btn';
                        removeBtn.title = 'Remover foto';
                        removeBtn.innerHTML = '<i class="fa-solid fa-xmark fa-xs"></i>';
                        removeBtn.onclick = function(e) {
                            e.stopPropagation();
                            removeProfilePhoto();
                        };
                        uploadBox.appendChild(removeBtn);
                    }
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        });
    }

    const coverPhoto = document.getElementById('cover_photo');
    if (coverPhoto) {
        coverPhoto.addEventListener('change', function(e) {
            if (e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const cover = document.getElementById('storeCover');
                    if (cover) {
                        cover.style.backgroundImage = 'url(' + event.target.result + ')';
                        cover.classList.add('has-cover');
                    }
                    if (window.TrilistaDB) {
                        TrilistaDB.saveProfile({ coverPhoto: event.target.result });
                    }
                    // Add remove button to upload box
                    const uploadBox = document.querySelector('.upload-area .upload-box:nth-child(2)');
                    if (uploadBox && !uploadBox.querySelector('.remove-btn')) {
                        uploadBox.classList.add('has-file');
                        const removeBtn = document.createElement('button');
                        removeBtn.className = 'remove-btn';
                        removeBtn.title = 'Remover capa';
                        removeBtn.innerHTML = '<i class="fa-solid fa-xmark fa-xs"></i>';
                        removeBtn.onclick = function(e) {
                            e.stopPropagation();
                            removeCoverPhoto();
                        };
                        uploadBox.appendChild(removeBtn);
                    }
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        });
    }

    // category selects validation
    const catSelects = document.querySelectorAll('.categoria-select');
    catSelects.forEach(sel => sel.addEventListener('change', handleCategoriaChange));
}

// Função para mostrar tooltip de ajuda
window.showHelpTooltip = function(event, message) {
    event.preventDefault();
    
    // Remover tooltip anterior se existir
    const existingTooltip = document.querySelector('.help-tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
        return;
    }
    
    // Criar novo tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'help-tooltip';
    tooltip.textContent = message;
    document.body.appendChild(tooltip);
    
    // Posicionar tooltip próximo ao botão
    const button = event.target.closest('.help-icon');
    const rect = button.getBoundingClientRect();
    tooltip.style.left = (rect.left - tooltip.offsetWidth / 2 + rect.width / 2) + 'px';
    tooltip.style.top = (rect.bottom + 10) + 'px';
    
    // Fechar ao clicar fora
    const closeTooltip = function(e) {
        if (!tooltip.contains(e.target) && !button.contains(e.target)) {
            tooltip.remove();
            document.removeEventListener('click', closeTooltip);
        }
    };
    
    setTimeout(() => {
        document.addEventListener('click', closeTooltip);
    }, 0);
};

// Funções globais necessárias
window.toggleSection = function(sectionId) {
    const content = document.getElementById(sectionId + '-content');
    const arrow = document.querySelector(`#${sectionId}-section .toggle-arrow`);
    
    if (content) {
        content.classList.toggle('open');
        if (arrow) arrow.classList.toggle('open');
    }
};

function updatePreviewLocation(profile) {
    const locationDiv = document.getElementById('previewStoreLocation');
    const addressSpan = document.getElementById('previewStoreAddress');
    const neighborhoodSpan = document.getElementById('previewStoreNeighborhood');
    const citySpan = document.getElementById('previewStoreCity');
    const comma = document.getElementById('addressComma');
    const separator = document.getElementById('neighborhoodSeparator');
    
    if (profile.address || profile.neighborhood || profile.city) {
        if (addressSpan) addressSpan.textContent = profile.address || '';
        if (neighborhoodSpan) neighborhoodSpan.textContent = profile.neighborhood || '';
        if (citySpan) citySpan.textContent = profile.city || '';
        
        if (comma) {
            comma.style.display = (profile.address && (profile.neighborhood || profile.city)) ? 'inline' : 'none';
        }
        
        if (separator) {
            separator.style.display = (profile.neighborhood && profile.city) ? 'inline' : 'none';
        }
        
        if (locationDiv) locationDiv.style.display = 'flex';
    } else {
        if (locationDiv) locationDiv.style.display = 'none';
    }
}

function isViewCounterEnabled(value) {
    return value === true || value === 'true' || value === 1 || value === '1';
}

function updatePreviewViewCounter(profile) {
    const counterEl = document.getElementById('previewViewCounter');
    const counterValueEl = document.getElementById('previewViewCounterValue');
    if (!counterEl || !counterValueEl) return;

    const currentProfile = profile || (window.TrilistaDB && typeof TrilistaDB.getProfile === 'function'
        ? (TrilistaDB.getProfile() || {})
        : {});
    const stats = window.TrilistaDB && typeof TrilistaDB.getStats === 'function'
        ? (TrilistaDB.getStats() || {})
        : {};

    if (!isViewCounterEnabled(currentProfile.showViewCounter)) {
        counterEl.style.display = 'none';
        return;
    }

    counterValueEl.textContent = String(Number(stats.views || 0));
    counterEl.style.display = 'inline-flex';
}

function updatePreviewSegments(profile) {
    return;
}

// Função para formatar o texto do editor (Bio)
function formatDoc(cmd, value = null) {
    document.execCommand(cmd, false, value);
    const editor = document.getElementById('store_bio');
    if (editor) {
        editor.focus();
        handleEditorInput(editor);
    }
}

// Função para tratar entrada no editor contenteditable
function handleEditorInput(element) {
    const charCountEl = document.getElementById('charCount');
    const text = element.innerText || "";
    const length = text.length;

    // Limite de 500 caracteres
    if (length > 500) {
        // Truncar mantendo a formatação HTML é complexo, 
        // então apenas impedimos novos caracteres se passar do limite no input
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        // ... (lógica simplificada: o usuário terá que apagar para continuar)
    }

    if (charCountEl) {
        charCountEl.innerText = length;
        charCountEl.style.color = length > 500 ? '#e53e3e' : '#94a3b8';
        charCountEl.classList.toggle('warning', length > 480 && length <= 500);
    }

    // Atualizar preview em tempo real
    const previewBio = document.getElementById('previewStoreBio');
    if (previewBio) {
        // Usamos innerHTML para manter o negrito e quebras de linha no preview
        const html = (element.innerHTML || '').trim();
        const plainText = text.trim();
        previewBio.innerHTML = plainText ? html : 'Sua bio aparecera aqui...';
    }
}

// Tratar colagem de texto (limpar formatação externa e manter limite)
function handleEditorPaste(e) {
    e.preventDefault();
    const text = (e.originalEvent || e).clipboardData.getData('text/plain');
    const editor = document.getElementById('store_bio');
    const currentLength = (editor.innerText || "").length;
    const available = 500 - currentLength;

    if (available > 0) {
        const truncated = text.substring(0, available);
        document.execCommand('insertText', false, truncated);
    }
}

// Atualizar openEmojiPicker para lidar com contenteditable
function openEmojiPicker(elementId) {
    const editor = document.getElementById(elementId);
    if (!editor) return;

    // Salvar posição do cursor no editor
    const selection = window.getSelection();
    let savedRange = null;
    if (selection.rangeCount > 0) {
        savedRange = selection.getRangeAt(0);
    }

    const existingBackdrop = document.querySelector('.emoji-backdrop');
    if (existingBackdrop) existingBackdrop.remove();

    const backdrop = document.createElement('div');
    backdrop.className = 'emoji-backdrop';
    Object.assign(backdrop.style, {
        position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
        background: 'rgba(0, 0, 0, 0.4)', zIndex: '9999', display: 'flex',
        alignItems: 'center', justifyContent: 'center'
    });

    const pickerContainer = document.createElement('div');
    pickerContainer.className = 'emoji-picker-wrapper';
    pickerContainer.style.zIndex = '10000';
    
    const pickerOptions = {
        data: async () => {
            const response = await fetch('https://cdn.jsdelivr.net/npm/@emoji-mart/data');
            return response.json();
        },
        onEmojiSelect: (emoji) => {
            editor.focus();
            if (savedRange) {
                selection.removeAllRanges();
                selection.addRange(savedRange);
            }

            // Inserir emoji como texto (mantendo compatibilidade com contenteditable)
            document.execCommand('insertText', false, emoji.native);
            handleEditorInput(editor);
            backdrop.remove();
        },
        onClickOutside: () => backdrop.remove(),
        locale: 'pt', theme: 'light', set: 'native'
    };

    const picker = new EmojiMart.Picker(pickerOptions);
    pickerContainer.appendChild(picker);
    backdrop.appendChild(pickerContainer);
    document.body.appendChild(backdrop);
    backdrop.onclick = (e) => { if (e.target === backdrop) backdrop.remove(); };
}

function getTimeGreeting() {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
}

function updatePanelTitle(profile) {
    const titleElement = document.getElementById('panelTitle');
    if (titleElement) {
        const storeName = profile.storeName || 'Minha Loja';
        titleElement.innerHTML = `
            <span class="panel-title-copy">
                <img src="src/img/Logo Trilista.png" alt="Trilista" class="panel-title-logo">
                <span class="panel-title-greeting">${getTimeGreeting()}</span>
                <span class="panel-title-name">${storeName}</span>
            </span>
        `;
    }
}

function removeProfilePhoto() {
    const storeAvatar = document.querySelector('.store-avatar');
    if (storeAvatar) {
        storeAvatar.innerHTML = '<i class="fa-solid fa-store"></i>';
        if (window.TrilistaDB) {
            TrilistaDB.saveProfile({ profilePhoto: null });
        }
    }
    // clear file input so change fires again and remove remove button
    const input = document.getElementById('profile_photo');
    if (input) input.value = '';
    const uploadBox = document.querySelector('.upload-area .upload-box:first-child');
    if (uploadBox) {
        uploadBox.classList.remove('has-file');
        const removeBtn = uploadBox.querySelector('.remove-btn');
        if (removeBtn) uploadBox.removeChild(removeBtn);
    }
}

function removeCoverPhoto() {
    const cover = document.getElementById('storeCover');
    if (cover) {
        cover.style.backgroundImage = '';
        cover.style.height = '';
        cover.style.marginBottom = '';
        cover.classList.remove('has-cover');
        if (window.TrilistaDB) {
            TrilistaDB.saveProfile({ coverPhoto: null });
        }
    }
    // clear file input and remove button
    const input = document.getElementById('cover_photo');
    if (input) input.value = '';
    const uploadBox = document.querySelector('.upload-area .upload-box:nth-child(2)');
    if (uploadBox) {
        uploadBox.classList.remove('has-file');
        const removeBtn = uploadBox.querySelector('.remove-btn');
        if (removeBtn) uploadBox.removeChild(removeBtn);
    }
}

window.saveProfileData = async function() {
    const storeName = document.getElementById('store_name')?.value;
    const trimmedStoreName = (storeName || '').replace(/\s+/g, ' ').trim();
    const bioEditor = document.getElementById('store_bio');
    const bio = bioEditor ? bioEditor.innerHTML : ""; // Pegamos innerHTML para salvar formatação
    const address = buildAddressValue();
    const neighborhood = document.getElementById('store_neighborhood')?.value;
    const city = document.getElementById('store_city')?.value;
    const categoria1El = document.getElementById('categoria1');
    const categoria2El = document.getElementById('categoria2');
    const categoria3El = document.getElementById('categoria3');
    const categoria4El = document.getElementById('categoria4');

    const categoria1 = categoria1El?.value;
    const categoria2 = categoria2El?.value;
    const categoria3 = categoria3El?.value;
    const categoria4 = categoria4El?.value;
    const showViewCounter = document.getElementById('show_view_counter')?.checked;

    const categoria1Text = categoria1El?.selectedOptions[0]?.text || '';
    const categoria2Text = categoria2El?.selectedOptions[0]?.text || '';
    const categoria3Text = categoria3El?.selectedOptions[0]?.text || '';
    const categoria4Text = categoria4El?.selectedOptions[0]?.text || '';

    if (!trimmedStoreName) {
        alert('Por favor, preencha o nome da loja.');
        return;
    }
    
    if (window.TrilistaDB) {
        const currentUser = window.Auth && typeof Auth.getCurrentUser === 'function'
            ? Auth.getCurrentUser()
            : null;

        if (currentUser && window.Auth && typeof Auth.updateUser === 'function') {
            const updateUserResult = await Auth.updateUser(currentUser.id, { nomeEmpresa: trimmedStoreName });
            if (!updateUserResult.success) {
                alert(updateUserResult.message);
                return;
            }
        }

        const currentProfile = typeof TrilistaDB.getProfile === 'function'
            ? (TrilistaDB.getProfile() || {})
            : {};
        const avatarImg = document.querySelector('.store-avatar img');
        const profilePhoto = avatarImg?.src || currentProfile.profilePhoto || null;
        const coverEl = document.getElementById('storeCover');
        const coverBg = coverEl?.style?.backgroundImage || '';
        const coverMatch = coverBg.match(/url\(["']?(.*?)["']?\)/);
        const coverPhoto = coverMatch?.[1] || currentProfile.coverPhoto || null;

        TrilistaDB.saveProfile({ 
            storeName: trimmedStoreName, 
            bio: bio, 
            profilePhoto,
            coverPhoto,
            address: address, 
            neighborhood: neighborhood, 
            city: city,
            showViewCounter: Boolean(showViewCounter),
            categoria1, categoria2, categoria3, categoria4,
            categoria1Text, categoria2Text, categoria3Text, categoria4Text
        });
        
        // Update preview
        updatePreviewLocation({ address: address, neighborhood: neighborhood, city: city });
        updatePreviewSegments();
        
        // Update panel title
        updatePanelTitle({ storeName: trimmedStoreName });

        if (window.CustomAppearanceManager) {
            CustomAppearanceManager.showToast('Perfil salvo com sucesso!');
        } else {
            alert('Perfil salvo com sucesso!');
        }
    }
};

window.resetProfileChanges = function() {
    if (window.TrilistaDB) {
        const profile = TrilistaDB.getProfile();
        if (profile) {
            if (profile.storeName) {
                document.getElementById('store_name').value = profile.storeName;
                document.getElementById('previewStoreName').textContent = profile.storeName;
            }
            if (profile.bio) {
                const bioEditor = document.getElementById('store_bio');
                if (bioEditor) {
                    bioEditor.innerHTML = profile.bio;
                    handleEditorInput(bioEditor);
                }
            }
            if (profile.address) {
                const parts = profile.address.split(',');
                const street = parts[0]?.trim() || '';
                const numberPart = parts[1]?.trim() || '';

                document.getElementById('store_address').value = street;
                const numberInput = document.getElementById('store_number');
                const numberSn = document.getElementById('store_number_sn');
                if (numberInput) {
                    if (numberPart.toLowerCase() === 's/n') {
                        numberInput.value = '';
                        if (numberSn) numberSn.checked = true;
                        numberInput.disabled = true;
                    } else {
                        numberInput.value = numberPart;
                        if (numberSn) numberSn.checked = false;
                        numberInput.disabled = false;
                    }
                }
            }
            if (profile.neighborhood) {
                document.getElementById('store_neighborhood').value = profile.neighborhood;
            }
            if (profile.city) {
                document.getElementById('store_city').value = profile.city;
            }
            const showViewCounterInput = document.getElementById('show_view_counter');
            if (showViewCounterInput) {
                showViewCounterInput.checked = (
                    profile.showViewCounter === true ||
                    profile.showViewCounter === 'true' ||
                    profile.showViewCounter === 1 ||
                    profile.showViewCounter === '1'
                );
            }
            updatePreviewViewCounter(profile);
            // restore categories
            ['categoria1','categoria2','categoria3','categoria4'].forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.value = profile[id] || '';
                    updateSelectState(el);
                }
            });
            
            // Update preview segments and location
            updatePreviewSegments(profile);
            updatePreviewLocation(profile);
            
            // Update panel title
            updatePanelTitle(profile);
        }
    }
};

window.saveEntireStore = async function() {
    const storeNameInput = document.getElementById('store_name');
    const storeName = storeNameInput ? storeNameInput.value : '';
    const bioEditor = document.getElementById('store_bio');
    const bio = bioEditor ? bioEditor.innerHTML : ""; // Pegamos innerHTML para salvar formatação
    const address = buildAddressValue();
    const neighborhoodInput = document.getElementById('store_neighborhood');
    const neighborhood = neighborhoodInput ? neighborhoodInput.value : '';
    const cityInput = document.getElementById('store_city');
    const city = cityInput ? cityInput.value : '';
    const showViewCounter = document.getElementById('show_view_counter')?.checked;

    if (!storeName || storeName.trim() === '') {
        alert('Por favor, preencha o nome da loja.');
        toggleSection('profile');
        if (storeNameInput) storeNameInput.focus();
        return;
    }

    const trimmedName = storeName.trim();

    if (window.TrilistaDB) {
        const currentUser = window.Auth && typeof Auth.getCurrentUser === 'function'
            ? Auth.getCurrentUser()
            : null;

        if (currentUser && window.Auth && typeof Auth.updateUser === 'function') {
            const updateUserResult = await Auth.updateUser(currentUser.id, { nomeEmpresa: trimmedName });
            if (!updateUserResult.success) {
                alert(updateUserResult.message);
                return;
            }
        }

        const cat1El = document.getElementById('categoria1');
        const cat2El = document.getElementById('categoria2');
        const cat3El = document.getElementById('categoria3');
        const cat4El = document.getElementById('categoria4');
        const currentProfile = typeof TrilistaDB.getProfile === 'function'
            ? (TrilistaDB.getProfile() || {})
            : {};
        const avatarImg = document.querySelector('.store-avatar img');
        const profilePhoto = avatarImg?.src || currentProfile.profilePhoto || null;
        const coverEl = document.getElementById('storeCover');
        const coverBg = coverEl?.style?.backgroundImage || '';
        const coverMatch = coverBg.match(/url\(["']?(.*?)["']?\)/);
        const coverPhoto = coverMatch?.[1] || currentProfile.coverPhoto || null;
        
        // Salvar Perfil
        TrilistaDB.saveProfile({ 
            storeName: trimmedName, 
            bio: bio?.trim() || '', 
            profilePhoto,
            coverPhoto,
            address: address?.trim() || '', 
            neighborhood: neighborhood?.trim() || '', 
            city: city?.trim() || '',
            showViewCounter: Boolean(showViewCounter),
            categoria1: cat1El?.value || '',
            categoria2: cat2El?.value || '',
            categoria3: cat3El?.value || '',
            categoria4: cat4El?.value || '',
            categoria1Text: cat1El?.selectedOptions[0]?.text || '',
            categoria2Text: cat2El?.selectedOptions[0]?.text || '',
            categoria3Text: cat3El?.selectedOptions[0]?.text || '',
            categoria4Text: cat4El?.selectedOptions[0]?.text || ''
        });
        
        // Salvar Links
        if (window.LinksManager) {
            TrilistaDB.saveLinks(LinksManager.getLinks());
        }
        
        // Salvar Galeria (se houver Manager)
        if (window.GaleriaManager && typeof GaleriaManager.getGallery === 'function') {
            TrilistaDB.saveGallery(GaleriaManager.getGallery());
        }

        // Salvar Vídeos (se houver Manager)
        if (window.VideosManager && typeof VideosManager.getVideos === 'function') {
            TrilistaDB.saveVideos(VideosManager.getVideos());
        }

        // SALVAR APARÊNCIA (O MAIS IMPORTANTE)
        if (window.TemplateManager) {
            const current = TemplateManager.currentTemplate;
            if (current === 'custom' && window.CustomAppearanceManager) {
                // Se for custom, o CustomAppearanceManager cuida dos detalhes (silenciosamente)
                CustomAppearanceManager.saveCustomAppearance(true);
            } else {
                // Se for preset, o TemplateManager cuida (silenciosamente)
                TemplateManager.saveTemplate();
            }
        }

        // Sincronizar com a tabela 'theme' (legado para preview.html antigo se existir)
        if (window.Temas) {
            const themeData = {
                name: Temas.getCurrentTheme ? Temas.getCurrentTheme() : 'default',
                colors: Temas.getCurrentColors ? Temas.getCurrentColors() : { primary: '#667eea', secondary: '#764ba2', text: '#2d3748' },
                font: Temas.getCurrentFont ? Temas.getCurrentFont() : "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            };
            TrilistaDB.saveThemeData(themeData);
        }

        atualizarStorageDisplay();
        updatePanelTitle({ storeName: trimmedName });
        updatePreviewSegments();
        
        if (window.CustomAppearanceManager) {
            CustomAppearanceManager.showToast('Loja salva com sucesso!');
        } else {
            alert('Loja salva com sucesso!');
        }
    }
};

function atualizarStorageDisplay() {
    if (window.TrilistaDB) {
        const usage = TrilistaDB.getStorageUsage();
        const el = document.getElementById('storageUsage');
        if (el) {
            el.textContent = usage.kb + ' KB usados (' + usage.percentage + '%)';
        }
    }
}

window.openImportBackup = function() {
    const input = document.getElementById('backupImportInput');
    if (!input) return;
    input.value = '';
    input.click();
};

window.exportCurrentStoreBackup = function() {
    if (!window.TrilistaDB || typeof TrilistaDB.exportDB !== 'function') {
        alert('Backup indisponível no momento.');
        return;
    }

    TrilistaDB.exportDB();
};

window.openAccountSettingsModal = function() {
    const modal = document.getElementById('accountSettingsModal');
    const currentUser = window.Auth && typeof Auth.getCurrentUser === 'function'
        ? Auth.getCurrentUser()
        : null;

    if (!modal || !currentUser) {
        return;
    }

    const loginEmailInput = document.getElementById('account_login_email');
    const googleStatusInput = document.getElementById('account_google_status');
    const googleLinkButton = document.getElementById('account_google_link_button');
    const currentPasswordInput = document.getElementById('account_current_password');
    const newPasswordInput = document.getElementById('account_new_password');
    const confirmPasswordInput = document.getElementById('account_confirm_password');

    if (loginEmailInput) loginEmailInput.value = currentUser.email || '';
    if (googleStatusInput) googleStatusInput.value = currentUser.googleId ? 'Conectado' : 'Ainda não vinculada';
    if (googleLinkButton) {
        googleLinkButton.disabled = Boolean(currentUser.googleId);
        googleLinkButton.innerHTML = currentUser.googleId
            ? '<i class="fa-brands fa-google"></i> Google ja vinculado'
            : '<i class="fa-brands fa-google"></i> Vincular com Google';
    }
    if (currentPasswordInput) currentPasswordInput.value = '';
    if (newPasswordInput) newPasswordInput.value = '';
    if (confirmPasswordInput) confirmPasswordInput.value = '';

    modal.style.display = 'flex';
};

window.closeAccountSettingsModal = function() {
    const modal = document.getElementById('accountSettingsModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

window.linkGoogleAccount = async function() {
    if (!window.Auth || typeof Auth.startGoogleAccountLink !== 'function') {
        alert('Vinculo com Google indisponivel no momento.');
        return;
    }

    const result = await Auth.startGoogleAccountLink();
    if (!result.success) {
        alert(result.message);
    }
};

window.togglePanelPasswordVisibility = function(inputId, trigger = null) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);

    if (trigger) {
        const icon = trigger.querySelector('i');
        const isVisible = type === 'text';
        trigger.setAttribute('aria-label', isVisible ? 'Ocultar senha' : 'Mostrar senha');
        trigger.setAttribute('title', isVisible ? 'Ocultar senha' : 'Mostrar senha');

        if (icon) {
            icon.className = isVisible ? 'fa-regular fa-eye' : 'fa-regular fa-eye-slash';
        }
    }
};

window.saveAccountSettings = async function() {
    if (!window.Auth || typeof Auth.updateCurrentAccountSettings !== 'function') {
        alert('Configurações da conta indisponíveis no momento.');
        return;
    }

    const email = document.getElementById('account_login_email')?.value?.trim() || '';
    const currentPassword = document.getElementById('account_current_password')?.value || '';
    const newPassword = document.getElementById('account_new_password')?.value || '';
    const confirmPassword = document.getElementById('account_confirm_password')?.value || '';

    if (!email) {
        alert('Preencha o email da conta.');
        return;
    }

    if ((newPassword || confirmPassword) && newPassword !== confirmPassword) {
        alert('A confirmação da nova senha não confere.');
        return;
    }

    const result = await Auth.updateCurrentAccountSettings({
        email,
        currentPassword,
        newPassword
    });

    if (!result.success) {
        alert(result.message);
        return;
    }

    alert(result.message);
    closeAccountSettingsModal();
};

window.importBackupFile = async function(event) {
    const file = event?.target?.files?.[0];
    if (!file || !window.TrilistaDB || typeof TrilistaDB.importDB !== 'function') return;

    const confirmImport = confirm('Importar este backup vai substituir os dados atuais desta loja. Deseja continuar?');
    if (!confirmImport) {
        event.target.value = '';
        return;
    }

    try {
        await TrilistaDB.importDB(file);
        closeAccountSettingsModal();
        alert('Backup importado com sucesso! O painel será recarregado.');
        window.location.reload();
    } catch (error) {
        alert(typeof error === 'string' ? error : 'Não foi possível importar o backup.');
    } finally {
        event.target.value = '';
    }
};

window.fazerLogout = function() {
    if (confirm('Tem certeza que deseja sair?')) {
        if (window.Auth) {
            Auth.logout();
        } else {
            localStorage.removeItem('trilista_current_user');
            window.location.href = 'index.html';
        }
    }
};

// Abre a pré-visualização em nova aba salvando um snapshot dos dados atuais
window.openPreview = function() {
    try {
        const db = (window.TrilistaDB && typeof TrilistaDB.getDB === 'function') ? TrilistaDB.getDB() : null;
        const dbKey = (window.Auth && typeof Auth.getCurrentUserDBKey === 'function') ? Auth.getCurrentUserDBKey() : ('preview_' + Date.now());
        const previewKey = 'trilista_preview_' + dbKey;

        // Atualizar dados atuais antes de criar snapshot
        if (db) {
            // Atualizar links se LinksManager estiver disponível
            if (window.LinksManager && typeof LinksManager.getLinks === 'function') {
                db.links = LinksManager.getLinks();
            }
            // Atualizar galeria se GaleriaManager estiver disponível
            if (window.GaleriaManager && typeof GaleriaManager.getGallery === 'function') {
                db.gallery = GaleriaManager.getGallery();
            }
            // Forçar salvamento e atualização de vídeos
            if (window.VideosManager && typeof VideosManager.getVideos === 'function') {
                db.videos = VideosManager.getVideos() || [];
                // Salvar no TrilistaDB também
                if (window.TrilistaDB && typeof TrilistaDB.saveVideos === 'function') {
                    TrilistaDB.saveVideos(db.videos);
                }
            }
            // Salvar db atualizado
            TrilistaDB.saveDB(db);
        }

        // Fallback: montar snapshot manualmente se TrilistaDB não retornar
        let snapshot = db;
        if (!snapshot) {
            const storeName = document.getElementById('store_name')?.value || 'Minha Loja Incrível';
            const bio = document.getElementById('store_bio')?.value || '';
            const avatarImg = document.querySelector('.store-avatar img');
            const profilePhoto = avatarImg ? avatarImg.src : null;
            const coverEl = document.getElementById('storeCover');
            let coverPhoto = null;
            if (coverEl) {
                const bg = coverEl.style.backgroundImage || '';
                const m = bg.match(/url\(["']?(.*?)["']?\)/);
                if (m) coverPhoto = m[1];
            }
            snapshot = {
                profile: { storeName, bio, profilePhoto, coverPhoto },
                links: (window.LinksManager && typeof LinksManager.getLinks === 'function') ? LinksManager.getLinks() : [],
                gallery: [],
                videos: []
            };
            try {
                if (window.GaleriaManager && typeof GaleriaManager.getGallery === 'function') {
                    snapshot.gallery = GaleriaManager.getGallery();
                }
            } catch(e) { snapshot.gallery = []; }
            try {
                if (window.VideosManager && typeof VideosManager.getVideos === 'function') {
                    snapshot.videos = VideosManager.getVideos() || [];
                }
            } catch(e) { snapshot.videos = []; }
        }

        localStorage.setItem(previewKey, JSON.stringify(snapshot));
        window.open('preview.html?preview=' + encodeURIComponent(previewKey), '_blank');
    } catch (e) {
        console.error('Erro ao abrir preview:', e);
        window.open('preview.html', '_blank');
    }
};

