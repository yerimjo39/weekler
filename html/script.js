const checkbox = document.querySelector('.schedule-area input[type="checkbox"]');

checkbox.addEventListener('change', function () {
    this.closest('li').classList.toggle('completed', this.checked);
});

document.querySelectorAll('.schedule-area input[type="checkbox"]').forEach(function(checkbox) {

    checkbox.addEventListener('change', function() {

        const li = this.closest('li');

        if (this.checked) {
            li.classList.add('completed');
        } else {
            li.classList.remove('completed');
        }

    });

});