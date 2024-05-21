class NPC extends Thing {
    constructor(data) {
        const id = data.id;

        data.actions = {
            talk: function() { game_command(id, 'talk', this) }
        }

        super(data);
    }
}