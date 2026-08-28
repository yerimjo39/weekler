/*1. 저장, 불러오기*/

//날짜를 yyyy-mm-dd 형식으로 만드는거
function formatDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}
//특수문자를 그냥 문자열로 바꾸기
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/*1-1. 주간 캘린더*/
const SCHEDULE_STORAGE_KEY = 'weekSchedules';
//저장된 일정 데이터 객체로 꺼내오기
function loadAllSchedules() {
    try {
        return JSON.parse(localStorage.getItem(SCHEDULE_STORAGE_KEY)) || {};
    } catch (e) {
        return {};
    }
}
//객체를 로컬스토리지에 저장
function saveAllSchedules(data) {
    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(data));
}
//[주간]수정된 일정 저장
function upsertSchedule(dateKey, id, changes) {
    const all = loadAllSchedules();
    if (!all[dateKey]) all[dateKey] = [];

    let item = all[dateKey].find((it) => it.id === id);
    if (!item) {
        item = { id, text: '', completed: false };
        all[dateKey].push(item);
    }
    Object.assign(item, changes);

    saveAllSchedules(all);
}
//일정 삭제
function removeSchedule(dateKey, id) {
    const all = loadAllSchedules();
    if (!all[dateKey]) return;

    all[dateKey] = all[dateKey].filter((it) => it.id !== id);
    saveAllSchedules(all);
}
//일정 데이터로 li 생성
function createScheduleLi(item) {
    const li = document.createElement('li');
    li.dataset.id = item.id;
    if (item.completed) li.classList.add('completed');

    li.innerHTML = `
        <input type="checkbox" ${item.completed ? 'checked' : ''}>
        <span contenteditable="true">${escapeHtml(item.text)}</span>
        <button>⋮</button>
        <div class="delete-schedule">
            <button>일정 삭제</button>
        </div>
    `;

    return li;
}

/*1-2.월간 캘린더*/
const MONTH_STORAGE_KEY = 'monthPlans';

function loadAllPlans() {
    try {
        return JSON.parse(localStorage.getItem(MONTH_STORAGE_KEY)) || {};
    } catch (e) {
        return {};
    }
}

function saveAllPlans(data) {
    localStorage.setItem(MONTH_STORAGE_KEY, JSON.stringify(data));
}
//일정 추가
function addPlanToStorage(dateKey, item) {
    const all = loadAllPlans();
    if (!all[dateKey]) all[dateKey] = [];
    all[dateKey].push(item);
    saveAllPlans(all);
}
//일정 삭제
function removePlanFromStorage(dateKey, id) {
    const all = loadAllPlans();
    if (!all[dateKey]) return;

    all[dateKey] = all[dateKey].filter((it) => it.id !== id);
    saveAllPlans(all);
}
//일정 데이터로 div 생성
function createPlanDiv(item) {
    const planDiv = document.createElement('div');
    planDiv.classList.add('plan');
    planDiv.dataset.id = item.id;
    planDiv.textContent = item.text;
    return planDiv;
}

/*전체일정목록(TODO)*/
const TODO_STORAGE_KEY = 'todoItems';

function loadAllTodoItems() {
    try {
        return JSON.parse(localStorage.getItem(TODO_STORAGE_KEY)) || {};
    } catch (e) {
        return {};
    }
}

function saveAllTodoItems(data) {
    localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(data));
}
//일정 추가
function addTodoItem(categoryKey, item) {
    const all = loadAllTodoItems();
    if (!all[categoryKey]) all[categoryKey] = [];
    all[categoryKey].push(item);
    saveAllTodoItems(all);
}
//일정 수정
function updateTodoItem(categoryKey, id, changes) {
    const all = loadAllTodoItems();
    if (!all[categoryKey]) return;

    const item = all[categoryKey].find((it) => it.id === id);
    if (!item) return;

    Object.assign(item, changes);
    saveAllTodoItems(all);
}

function removeTodoItem(categoryKey, id) {
    const all = loadAllTodoItems();
    if (!all[categoryKey]) return;

    all[categoryKey] = all[categoryKey].filter((it) => it.id !== id);
    saveAllTodoItems(all);
}
//일정 데이터로 li 생성
function createTodoLi(item) {
    const li = document.createElement('li');
    li.dataset.id = item.id;
    if (item.completed) li.classList.add('completed');

    const dateHtml = item.time ? `<div class="date">${escapeHtml(item.time)}</div>` : '';

    li.innerHTML = `
        <input type="checkbox" ${item.completed ? 'checked' : ''}>
        <span>${escapeHtml(item.text)}</span>
        ${dateHtml}
    `;

    return li;
}
//카테고리 생성
function createCategoryArticle(categoryKey) {
    const article = document.createElement('article');
    article.classList.add('category'); // ★ 이 줄이 빠져서 CSS 적용이 안 됐던 것입니다 ★
    article.dataset.category = categoryKey;

    article.innerHTML = `
        <div class="category-header">
            <h3>${escapeHtml(categoryKey)}</h3>
            <div class="header-buttons">
                <button class="plus">+</button>
                <button class="menu">⋮</button>
            </div>
             <div class="schedule-edit">
                <button>카테고리 삭제</button>
                <button>일정 편집</button>
             </div>
        </div> 

        <div class="category-content">
            <ul>
                <li></li>
            </ul>
        </div>
        
        <section class="edit-toolbar">
            <button class="delete-button">
                <i class="fa-solid fa-trash"></i>
            </button>
            <button class="complete-button">
                <i class="fa-solid fa-check"></i>
            </button>
        </section>
    `;

    return article;
}
// 카테고리가 저장소에 없으면 빈 배열로 등록
function initTodoCategoryStorage(article, categoryKey) {
    const all = loadAllTodoItems();
    if (all[categoryKey]) return;

    all[categoryKey] = [];
    saveAllTodoItems(all);
}

/*2. 화면 그리기(랜더링)*/

let currentDate = new Date();
let currentWeekDate = new Date();

/*2-1.월간캘린더*/
//월간 캘린더 그리기
function renderMonthCalendar() {
    const calendarBody = document.getElementById('calendar-body');
    const yearEl = document.getElementById('current-year');
    const monthEl = document.getElementById('current-month');
    if (!calendarBody) return;
    calendarBody.innerHTML = '';

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (yearEl) yearEl.textContent = year;
    if (monthEl) monthEl.textContent = month + 1;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);

    let firstDayIndex = firstDay.getDay() - 1;
    if (firstDayIndex === -1) firstDayIndex = 6;

    const totalDays = lastDay.getDate();
    const prevLastDate = prevLastDay.getDate();

    let dateCount = 1;
    let nextDateCount = 1;
    const today = new Date();
    const gridStartDate = new Date(year, month, 1 - firstDayIndex);

    for (let i = 0; i < 6; i++) {
        const tr = document.createElement('tr');

        for (let j = 0; j < 7; j++) {
            const td = document.createElement('td');
            const dateSpan = document.createElement('span');
            dateSpan.classList.add('date');

            const cellDate = new Date(gridStartDate);
            cellDate.setDate(gridStartDate.getDate() + (i * 7 + j));
            const cellDateKey = formatDateKey(cellDate);
            td.dataset.date = cellDateKey;

            if (i === 0 && j < firstDayIndex) {
                dateSpan.textContent = prevLastDate - (firstDayIndex - 1 - j);
                td.classList.add('other-month');
            } else if (dateCount <= totalDays) {
                dateSpan.textContent = dateCount;

                if (year === today.getFullYear() && month === today.getMonth() && dateCount === today.getDate()) {
                    td.classList.add('today');
                }
                dateCount++;
            } else {
                dateSpan.textContent = nextDateCount++;
                td.classList.add('other-month');
            }

            td.appendChild(dateSpan);
            renderPlansForCell(td, cellDateKey);
            tr.appendChild(td);
        }

        calendarBody.appendChild(tr);

        if (dateCount > totalDays && i >= 4) {
            if (tr.querySelectorAll('.other-month').length === 7) {
                tr.remove();
            }
        }
    }
}
// 저장된 일정을 날짜 셀에 렌더링
function renderPlansForCell(td, dateKey) {
    td.querySelectorAll('.plan').forEach((el) => el.remove());

    const items = loadAllPlans()[dateKey] || [];
    items.forEach((item) => {
        td.appendChild(createPlanDiv(item));
    });
}

/*2-2.주간캘린더*/
//날짜가 속한 주의 월요일을 계산해서 돌려줌
function getMonday(d) {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diff);
    return date;
}
//월요일의 날짜가 달의 몇 번째 주인지 돌려줌
function getWeekNumber(monday) {
    const year = monday.getFullYear();
    const month = monday.getMonth();
    const firstDay = new Date(year, month, 1);
    const mondayIndex = (firstDay.getDay() + 6) % 7;
    return Math.ceil((monday.getDate() + mondayIndex) / 7);
}
//주간 캘린더 그리기
function renderWeekCalendar(baseDate) {
    const weekHeaderH2 = document.querySelector('#week-header h2');
    const articles = document.querySelectorAll('#calendar article');

    if (!weekHeaderH2 || articles.length === 0) return;

    const monday = getMonday(baseDate);
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        weekDates.push(d);
    }

    let targetYear = monday.getFullYear();
    let targetMonth = monday.getMonth();
    let weekNum = getWeekNumber(monday);

    const nextMonthFirstDay = weekDates.find(d => d.getDate() === 1 && d.getTime() !== monday.getTime());
    if (nextMonthFirstDay) {
        targetYear = nextMonthFirstDay.getFullYear();
        targetMonth = nextMonthFirstDay.getMonth();
        
        weekNum = getWeekNumber(nextMonthFirstDay);
    }

    weekHeaderH2.textContent = `${targetYear} ${targetMonth + 1}월 ${weekNum}주차`;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    articles.forEach((article, i) => {
        const dayDate = weekDates[i];

        const dateH3 = article.querySelector('div:first-child h3');
        if (dateH3) dateH3.textContent = dayDate.getDate();

        article.classList.toggle('today', dayDate.getTime() === today.getTime());

        const dateKey = formatDateKey(dayDate);
        article.dataset.date = dateKey;
        renderScheduleList(article, dateKey);
    });
}
//저장된 일정을 해당 날짜의 목록에 렌더링
function renderScheduleList(article, dateKey) {
    const ul = article.querySelector('.schedule-area ul');
    if (!ul) return;

    ul.innerHTML = '';

    const items = loadAllSchedules()[dateKey] || [];
    items.forEach((item) => {
        ul.appendChild(createScheduleLi(item));
    });
}

/*2-3.전체일정목록*/
//저장된 일정을 해당 카테고리 목록에 렌더링
function renderTodoList(article, categoryKey) {
    const ul = article.querySelector('.category-content ul');
    if (!ul) return;

    ul.innerHTML = '';

    const items = loadAllTodoItems()[categoryKey] || [];
    items.forEach((item) => {
        ul.appendChild(createTodoLi(item));
    });
}

/*3. 사용자 반응*/

document.addEventListener('DOMContentLoaded', () => {

    /*3-1.공통*/
    renderWeekCalendar(currentWeekDate);
    renderMonthCalendar();
    initTodoPage();

    // 상단 페이지 전환 버튼
    const header = document.querySelector('header');
    if (header) {
        header.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;

            if (btn.classList.contains('mon')) {
                location.href = 'month.html';
            } else if (btn.classList.contains('week')) {
                location.href = 'index.html';
            } else if (btn.classList.contains('todo')) {
                location.href = 'todo.html';
            }
        });
    }

    const scheduleModal = document.querySelector('.schedule-modal');
    const saveBtn = document.querySelector('.save-button');
    const closeBtn = document.querySelector('.close-button');
    const titleInput = document.querySelector('.schedule-title input');
    const timeInput = document.querySelector('.schedule-time input');


    // 주간
    // 이전/다음 주 이동 버튼
    const weekHeader = document.querySelector('#week-header');
    if (weekHeader) {
        const weekNavButtons = weekHeader.querySelectorAll('button');
        const prevWeekBtn = weekNavButtons[0];
        const nextWeekBtn = weekNavButtons[1];

        if (prevWeekBtn) {
            prevWeekBtn.addEventListener('click', () => {
                currentWeekDate.setDate(currentWeekDate.getDate() - 7);
                renderWeekCalendar(currentWeekDate);
            });
        }

        if (nextWeekBtn) {
            nextWeekBtn.addEventListener('click', () => {
                currentWeekDate.setDate(currentWeekDate.getDate() + 7);
                renderWeekCalendar(currentWeekDate);
            });
        }
    }

    // 일정 추가 및 편집
    const monthCalendar = document.querySelector('#calendar table');
    const weekCalendar = document.querySelector('#calendar');

    if (weekCalendar && !monthCalendar) {
        weekCalendar.addEventListener('click', function (e) {
            //더보기 버튼 클릭했을 때 일정 삭제 버튼 보이기
            if (e.target.matches('.schedule-area li > button')) {
                const deleteMenu = e.target.nextElementSibling;
                if (deleteMenu) deleteMenu.classList.toggle('show');
                return;
            }
            //일정 삭제
            if (e.target.closest('.delete-schedule button')) {
                const li = e.target.closest('li');
                const article = e.target.closest('article');
                if (li && article) {
                    removeSchedule(article.dataset.date, li.dataset.id);
                    li.remove();
                }
                return;
            }
            //빈 공간 클릭 시 일정 추가
            const scheduleArea = e.target.closest('.schedule-area');
            if (!scheduleArea) return;
            if (e.target.closest('li')) return;

            addNewSchedule(scheduleArea);
        });
        //체크 여부 확인 후 상태 변경
        weekCalendar.addEventListener('change', function (e) {
            if (!e.target.matches('.schedule-area input[type="checkbox"]')) return;

            const li = e.target.closest('li');
            const article = e.target.closest('article');
            if (!li || !article) return;

            const completed = e.target.checked;
            li.classList.toggle('completed', completed);
            upsertSchedule(article.dataset.date, li.dataset.id, { completed });
        });
        //텍스트 입력을 끝냈을 때 빈칸이면 삭제, 텍스트가 있으면 저장
        weekCalendar.addEventListener('focusout', function (e) {
            if (!e.target.matches('.schedule-area li span[contenteditable="true"]')) return;

            const li = e.target.closest('li');
            const article = e.target.closest('article');
            if (!li || !article) return;

            const dateKey = article.dataset.date;
            const text = e.target.textContent.trim();

            if (text === '') {
                removeSchedule(dateKey, li.dataset.id);
                li.remove();
                return;
            }

            upsertSchedule(dateKey, li.dataset.id, { text });
        });
    }


    //월간
    // 이전/다음 달 이동 버튼
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderMonthCalendar();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderMonthCalendar();
        });
    }

    // 일정 추가 및 편집
    let selectedTd = null;

    if (monthCalendar && scheduleModal) {
        //일정 우클릭 시 삭제 메뉴
        monthCalendar.addEventListener('contextmenu', (e) => {
            const plan = e.target.closest('.plan');
            if (plan) {
                e.preventDefault();
                e.stopPropagation();

                const confirmDelete = confirm(`'${plan.textContent}' 일정을 삭제하시겠습니까?`);
                if (confirmDelete) {
                    const td = plan.closest('td');
                    if (td) {
                        removePlanFromStorage(td.dataset.date, plan.dataset.id);
                    }
                    plan.remove();
                }
            }
        });
        //날짜 빈 칸 클릭 시 일정 추가 팝업 열기
        monthCalendar.addEventListener('click', (e) => {
            const td = e.target.closest('td');
            if (!td) return;
            if (e.target.closest('.plan')) return;

            selectedTd = td;

            if (titleInput) titleInput.value = '';
            if (timeInput) timeInput.value = '';

            scheduleModal.style.display = 'block';
            if (titleInput) titleInput.focus();
        });
        //팝업 닫기
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                closeModal();
                closeTodoModal();
            });
        }

        function closeModal() {
            scheduleModal.style.display = 'none';
            selectedTd = null;
        }

        if (saveBtn) {
            //일정 저장
            saveBtn.addEventListener('click', () => {
                const titleText = titleInput ? titleInput.value.trim() : '';
                //2개 이상이면 저장x
                if (selectedTd) {
                    const currentPlans = selectedTd.querySelectorAll('.plan');
                    if (currentPlans.length >= 2) {
                        alert('일정을 등록할 수 없습니다.');
                        closeModal();
                        return;
                    }
                    //시간 입력 시 대괄호로 표시
                    const timeText = timeInput && timeInput.value ? ` [${timeInput.value}]` : '';
                    const dateKey = selectedTd.dataset.date;
                    const id = `p${Date.now()}${Math.random().toString(16).slice(2)}`;
                    const item = { id, text: titleText + timeText };

                    addPlanToStorage(dateKey, item);
                    selectedTd.appendChild(createPlanDiv(item));
                }

                closeModal();
            });
        }
    }


    //전체일정목록
    //일정 추가
    const categoryList = document.querySelector('.category-list');
    let selectedCategoryArticle = null;

    if (categoryList && scheduleModal) {
        function closeTodoModal() {
            scheduleModal.style.display = 'none';
            selectedCategoryArticle = null;
        }
        //+버튼 클릭 시 일정 추가 팝업 열기
        categoryList.addEventListener('click', (e) => {
            const plusBtn = e.target.closest('.category-header .plus');
            if (!plusBtn) return;

            const article = plusBtn.closest('article');
            if (!article) return;

            selectedCategoryArticle = article;

            if (titleInput) titleInput.value = '';
            if (timeInput) timeInput.value = '';

            scheduleModal.style.display = 'block';
            if (titleInput) titleInput.focus();
        });

        if (saveBtn) {
            //일정 추가(제목 비어있으면 저장X)
            saveBtn.addEventListener('click', () => {
                if (!selectedCategoryArticle) return;

                const text = titleInput ? titleInput.value.trim() : '';
                if (text === '') {
                    closeTodoModal();
                    return;
                }

                const time = timeInput ? timeInput.value : '';
                const id = `t${Date.now()}${Math.random().toString(16).slice(2)}`;
                const item = { id, text, time, completed: false };

                const categoryKey = selectedCategoryArticle.dataset.category;
                addTodoItem(categoryKey, item);

                const ul = selectedCategoryArticle.querySelector('.category-content ul');
                if (ul) ul.appendChild(createTodoLi(item));

                closeTodoModal();
            });
        }
        //체크박스 상태 변경
        categoryList.addEventListener('change', (e) => {
            if (!e.target.matches('.category-content input[type="checkbox"]')) return;

            const li = e.target.closest('li');
            const article = e.target.closest('article');
            if (!li || !article) return;

            const completed = e.target.checked;
            li.classList.toggle('completed', completed);
            updateTodoItem(article.dataset.category, li.dataset.id, { completed });
        });
    }

    const deleteModal = document.querySelector('.categorydelete-modal');
    const btnYes = deleteModal ? deleteModal.querySelector('.yes') : null;
    const btnNo = deleteModal ? deleteModal.querySelector('.no') : null;

    let targetCategoryArticle = null;

    if (categoryList) {
        categoryList.addEventListener('click', (e) => {
            //더보기 버튼
            const menuBtn = e.target.closest('.menu');
            if (menuBtn) {
                const article = menuBtn.closest('article');
                const menuBox = article ? article.querySelector('.schedule-edit') : null;

                if (menuBox) {
                    document.querySelectorAll('.schedule-edit.active').forEach((box) => {
                        if (box !== menuBox) box.classList.remove('active');
                    });
                    menuBox.classList.toggle('active');
                }
                return;
            }

            //카테고리 삭제 버튼
            const deleteCategoryBtn = e.target.closest('.schedule-edit button:nth-child(1)');
            if (deleteCategoryBtn) {
                targetCategoryArticle = deleteCategoryBtn.closest('article');
                const menuBox = deleteCategoryBtn.closest('.schedule-edit');
                if (menuBox) menuBox.classList.remove('active');

                if (deleteModal) deleteModal.style.display = 'flex';
                return;
            }

            //일정 편집 버튼
            const editScheduleBtn = e.target.closest('.schedule-edit button:nth-child(2)');
            if (editScheduleBtn) {
                const article = editScheduleBtn.closest('article');
                const menuBox = editScheduleBtn.closest('.schedule-edit');
                if (menuBox) menuBox.classList.remove('active');

                const toolbar = article ? article.querySelector('.edit-toolbar') : null;
                if (toolbar) {
                    toolbar.classList.add('active');
                }
                return;
            }

            //일정 편집 모드 다중 선택
            const li = e.target.closest('.category-content li');
            if (li) {
                const article = li.closest('article');
                const toolbar = article ? article.querySelector('.edit-toolbar') : null;

                if (toolbar && toolbar.classList.contains('active')) {
                    if (!e.target.matches('input[type="checkbox"]')) {
                        e.preventDefault();
                        li.classList.toggle('selected');
                    }
                }
            }

            //툴바 삭제 버튼
            const deleteToolbarBtn = e.target.closest('.edit-toolbar .delete-button');
            if (deleteToolbarBtn) {
                const article = deleteToolbarBtn.closest('article');
                const categoryKey = article ? article.dataset.category : null;
                const toolbar = article ? article.querySelector('.edit-toolbar') : null;
                const selectedItems = article ? article.querySelectorAll('.category-content li.selected') : [];

                selectedItems.forEach((li) => {
                    const id = li.dataset.id;
                    if (id && categoryKey) {
                        removeTodoItem(categoryKey, id);
                    }
                    li.remove();
                });

                if (toolbar) {
                    toolbar.classList.remove('active');
                }
                return;
            }

            //툴바 완료 버튼
            const closeToolbarBtn = e.target.closest('.edit-toolbar .complete-button');
            if (closeToolbarBtn) {
                const article = closeToolbarBtn.closest('article');
                const toolbar = article ? article.querySelector('.edit-toolbar') : null;

                if (article) {
                    article.querySelectorAll('.category-content li.selected').forEach((li) => {
                        li.classList.remove('selected');
                    });
                }
                if (toolbar) toolbar.classList.remove('active');
            }
        });
    }

    //카테고리 추가 팝업
    const categoryPlusBtn = document.querySelector('.categoryplus .plusbutton');
    const categoryNameModal = document.querySelector('.categoryname-modal');

    if (categoryPlusBtn && categoryNameModal) {
        const modalInput = categoryNameModal.querySelector('input.name');

        const closeCategoryModal = () => {
            if (modalInput) modalInput.value = '';
            categoryNameModal.style.display = 'none';
        };
        //+버튼 클릭 시 카테고리 이름 설정 팝업
        categoryPlusBtn.addEventListener('click', () => {
            if (modalInput) modalInput.value = '';
            categoryNameModal.style.display = 'flex';
            if (modalInput) modalInput.focus();
        });

        if (modalInput) {
            modalInput.addEventListener('keydown', (e) => {
                if (e.isComposing) return;
                //ESC버튼 누르면 팝업 닫음
                if (e.key === 'Escape') {
                    closeCategoryModal();
                    return;
                }
                //아무것도 쓰지 않고 ENTER치면 팝업 닫음
                if (e.key === 'Enter') {
                    e.preventDefault();

                    const categoryName = modalInput.value.trim();

                    if (!categoryName) {
                        closeCategoryModal();
                        return;
                    }
                    //새 카테고리 저장
                    allTodo[categoryName] = [];
                    saveAllTodoItems(allTodo);

                    const categoryPlus = categoryList ? categoryList.querySelector('.categoryplus') : null;

                    if (categoryList && categoryPlus) {
                        const newArticle = createCategoryArticle(categoryName);
                        categoryList.insertBefore(newArticle, categoryPlus);
                        renderTodoList(newArticle, categoryName);
                    }

                    closeCategoryModal();
                }
            });
        }
    }

    // 카테고리 삭제 팝업
    if (deleteModal) {
        if (btnYes) {
            btnYes.addEventListener('click', () => {
                if (targetCategoryArticle) {
                    const categoryKey = targetCategoryArticle.dataset.category;

                    if (categoryKey) {
                        const allTodo = loadAllTodoItems();
                        delete allTodo[categoryKey];
                        saveAllTodoItems(allTodo);
                    }

                    targetCategoryArticle.remove();
                    targetCategoryArticle = null;
                }
                deleteModal.style.display = 'none';
            });
        }

        if (btnNo) {
            btnNo.addEventListener('click', () => {
                targetCategoryArticle = null;
                deleteModal.style.display = 'none';
            });
        }
    }
});

//주간 캘린더에서 새 빈 일정 만들기
function addNewSchedule(scheduleArea) {
    const ul = scheduleArea.querySelector('ul');
    if (!ul) return;

    const id = `s${Date.now()}${Math.random().toString(16).slice(2)}`;
    const li = createScheduleLi({ id, text: '', completed: false });

    ul.prepend(li);

    const span = li.querySelector('span');
    span.focus();

    span.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            span.blur();
        }
    });
}
//TODO페이지 초기화
function initTodoPage() {
    const categoryList = document.querySelector('.category-list');
    if (!categoryList) return;

    const categoryPlus = categoryList.querySelector('.categoryplus');
    const allTodo = loadAllTodoItems();

    categoryList.querySelectorAll(':scope > article').forEach((article) => {
        if (article.classList.contains('categoryplus')) return;

        const h3 = article.querySelector('.category-header h3');
        const categoryKey = h3 ? h3.textContent.trim() : null;
        if (!categoryKey) return;

        article.dataset.category = categoryKey;
        initTodoCategoryStorage(article, categoryKey);
        renderTodoList(article, categoryKey);
    });

    Object.keys(allTodo).forEach((categoryKey) => {
        const exists = categoryList.querySelector(`article[data-category="${categoryKey}"]`);
        if (!exists && categoryPlus) {
            const newArticle = createCategoryArticle(categoryKey);
            categoryList.insertBefore(newArticle, categoryPlus);
            renderTodoList(newArticle, categoryKey);
        }
    });
}