/*1. 저장, 불러오기*/

/*2. 화면 그리기(랜더링)*/
let currentDate = new Date();

function renderMonthCalendar() {
    const calendarBody = document.getElementById('calendar-body');
    const yearEl = document.getElementById('current-year');
    const monthEl = document.getElementById('current-month');
    //월간 캘린더에서만 실행
    if (!calendarBody) return;
    //기존 캘린더 지우기
    calendarBody.innerHTML = '';

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (yearEl) yearEl.textContent = year;
    if (monthEl) monthEl.textContent = month + 1;
    //달력 날짜 계산
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
    //6행7열 캘린더
    for (let i = 0; i < 6; i++) {
        const tr = document.createElement('tr');

        for (let j = 0; j < 7; j++) {
            const td = document.createElement('td');
            const dateSpan = document.createElement('span');
            dateSpan.classList.add('date');

            // 이전 달 날짜
            if (i === 0 && j < firstDayIndex) {
                dateSpan.textContent = prevLastDate - (firstDayIndex - 1 - j);
                td.classList.add('other-month');
            } 
            // 이번 달 날짜
            else if (dateCount <= totalDays) {
                dateSpan.textContent = dateCount;

                if (year === today.getFullYear() && month === today.getMonth() && dateCount === today.getDate()) {
                    td.classList.add('today');
                }
                dateCount++;
            } 
            // 다음 달 날짜
            else {
                dateSpan.textContent = nextDateCount++;
                td.classList.add('other-month');
            }

            td.appendChild(dateSpan);
            tr.appendChild(td);
        }

        calendarBody.appendChild(tr);

        // 마지막주 불필요한 줄 제거
        if (dateCount > totalDays && i >= 4) {
            if (tr.querySelectorAll('.other-month').length === 7) {
                tr.remove();
            }
        }
    }
}

/*3. 사용자 반응*/
document.addEventListener('DOMContentLoaded', () => {
    renderMonthCalendar();

    // 3-1. [공통] 상단 헤더 페이지 전환
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

    // 3-2. [월간] 이전/다음 달 이동 버튼 ★(추가된 부분)★
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

    //일정 추가 및 편집
    const monthCalendar = document.querySelector('#calendar table');
    const scheduleModal = document.querySelector('.schedule-modal');
    const saveBtn = document.querySelector('.save-button');
    const closeBtn = document.querySelector('.close-button');
    const titleInput = document.querySelector('.schedule-title input');
    const timeInput = document.querySelector('.schedule-time input');

    let selectedTd = null;

    if (monthCalendar && scheduleModal) {
        // 일정 우클릭 시 삭제
        monthCalendar.addEventListener('contextmenu', (e) => {
            const plan = e.target.closest('.plan');
            if (plan) {
                e.preventDefault();
                e.stopPropagation();

                const confirmDelete = confirm(`'${plan.textContent}' 일정을 삭제하시겠습니까?`);
                if (confirmDelete) {
                    plan.remove();
                }
            }
        });

        // 캘린더 클릭 시 일정 추가 팝업
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

        // 취소 버튼
        if (closeBtn) closeBtn.addEventListener('click', closeModal);

        function closeModal() {
            scheduleModal.style.display = 'none';
            selectedTd = null;
        }

        // 체크 버튼
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const titleText = titleInput ? titleInput.value.trim() : '';

                if (selectedTd) {
                    // 일정 2개 이상 추가 방지
                    const currentPlans = selectedTd.querySelectorAll('.plan');
                    if (currentPlans.length >= 2) {
                        alert('일정을 등록할 수 없습니다.');
                        closeModal();
                        return;
                    }

                    const timeText = timeInput && timeInput.value ? ` [${timeInput.value}]` : '';

                    const planDiv = document.createElement('div');
                    planDiv.classList.add('plan');
                    planDiv.textContent = titleText + timeText;

                    selectedTd.appendChild(planDiv);
                }

                closeModal();
            });
        }
    }  

    // 3-3. [주간] 일정 추가 및 편집 (위치 순서 변경으로 변수 참조 에러 해결)
    const weekCalendar = document.querySelector('#calendar');

    if (weekCalendar && !monthCalendar) {
        weekCalendar.addEventListener('click', function (e) {
            // 더보기 메뉴
            if (e.target.matches('.schedule-area li > button')) {
                const deleteMenu = e.target.nextElementSibling;
                if (deleteMenu) deleteMenu.classList.toggle('show');
                return;
            }

            // 일정 삭제
            if (e.target.closest('.delete-schedule button')) {
                const li = e.target.closest('li');
                if (li) li.remove();
                return;
            }

            // 일정 추가
            const scheduleArea = e.target.closest('.schedule-area');
            if (!scheduleArea) return;
            if (e.target.closest('li')) return;

            addNewSchedule(scheduleArea);
        });
    }
});

function addNewSchedule(scheduleArea) {
    const ul = scheduleArea.querySelector('ul');
    if (!ul) return;

    const li = document.createElement('li');
    li.innerHTML = `
        <input type="checkbox">
        <span contenteditable="true"></span>
        <button>⋮</button>
        <div class="delete-schedule">
            <button>일정 삭제</button>
        </div>
    `;

    ul.prepend(li);

    const span = li.querySelector('span');
    span.focus();

    span.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            span.blur();
        }
    });

    span.addEventListener('blur', function () {
        if (span.textContent.trim() === '') {
            li.remove();
        }
    }, { once: true });
}