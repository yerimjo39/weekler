/*1. 저장, 불러오기*/

/*2. 화면 그리기(랜더링)*/

/*3.사용자 반응*/

/*3-1. 페이지 전환*/
document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('header')
    if(!header) return;

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
    })
})

const calendar = document.querySelector('#calendar');

/*3-2. 일정 추가 및 편집*/
calendar.addEventListener('click', function(e) {
    //더보기 메뉴
    if (e.target.matches('.schedule-area li > button')) {
        const deleteMenu = e.target.nextElementSibling;
        deleteMenu.classList.toggle('show');
        return;
    }

    //일정 삭제
    if (e.target.closest('.delete-schedule button')) {
        const li = e.target.closest('li');
        li.remove();
        return;
    }
    
    //일정 추가
    const scheduleArea = e.target.closest('.schedule-area');
    if (!scheduleArea) return;          
    if (e.target.closest('li')) return;

    addNewSchedule(scheduleArea);
});

function addNewSchedule(scheduleArea) {
    const ul = scheduleArea.querySelector('ul');

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

    span.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            span.blur();
        }
    });

    span.addEventListener('blur', function() {
        if (span.textContent.trim() === '') {
            li.remove();
        }
    }, { once: true });
}
